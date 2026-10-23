import logging
import json
import httpx
from datetime import datetime, timedelta, time, timezone
from typing import Optional, List, Dict, Any
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.database import settings
from app.models.market import MarketCache, MarketQuote
from app.provider import twelve_data
from app.provider import yahoo_finance
from app.provider import nse_market


logger = logging.getLogger(__name__)

CACHE_TTL_MINUTES = 5  # Cache quotes for 5 minutes
HISTORY_CACHE_TTL_MINUTES = 60  # Cache history for 1 hour
STATUS_CACHE_TTL_MINUTES = 15  # Cache status for 15 minutes

# Curated lists of popular equities for movers if API fails or lacks mover endpoints
POPULAR_US_STOCKS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "NFLX", "AMD", "INTC"]
POPULAR_IN_STOCKS = ["RELIANCE:NSE", "TCS:NSE", "HDFCBANK:NSE", "ICICIBANK:NSE", "INFY:NSE", "BHARTIARTL:NSE", "ITC:NSE", "SBIN:NSE", "LTIM:NSE", "TATAMOTORS:NSE"]

INDIA_INDEX_NAMES = {
    "NIFTY50": "NIFTY 50", "BANKNIFTY": "NIFTY BANK", "SENSEX": "SENSEX",
    "NIFTYNEXT50": "NIFTY NEXT 50", "NIFTY100": "NIFTY 100", "NIFTY200": "NIFTY 200",
    "NIFTY500": "NIFTY 500", "MIDCAP50": "NIFTY MIDCAP 50", "MIDCAP100": "NIFTY MIDCAP 100",
    "MIDCAP150": "NIFTY MIDCAP 150", "SMALLCAP100": "NIFTY SMALLCAP 100",
    "MIDSMALL400": "NIFTY MIDSMALLCAP 400",
}

INDIA_SECTOR_INDICES = [
    ("Auto", "NIFTYAUTO"), ("Bank", "BANKNIFTY"), ("Financial Services", "NIFTYFINANCIAL"),
    ("FMCG", "NIFTYFMCG"), ("IT", "NIFTYIT"), ("Media", "NIFTYMEDIA"),
    ("Metal", "NIFTYMETAL"), ("Pharma", "NIFTYPHARMA"), ("PSU Bank", "NIFTYPSUBANK"),
    ("Private Bank", "NIFTYPVTBANK"), ("Realty", "NIFTYREALTY"), ("Energy", "NIFTYENERGY"),
    ("Infrastructure", "NIFTYINFRA"),
]

def _get_api_key() -> Optional[str]:
    """Return a configured Twelve Data key, or ``None`` when unavailable."""
    key = (settings.TWELVE_DATA_KEY or "").strip()
    return key if key and key.lower() != "demo" else None


def _market_status_from_hours(offset: timedelta, opens_at: time, closes_at: time) -> str:
    """Return a regular-session state from a UTC offset without OS timezone data."""
    now = datetime.now(timezone.utc) + offset
    if now.weekday() >= 5:
        return "closed"
    current_time = now.time()
    return "open" if opens_at <= current_time < closes_at else "closed"


def _is_us_daylight_saving(now_utc: datetime) -> bool:
    """Determine U.S. Eastern DST using the U.S. statutory transition dates."""
    year = now_utc.year
    march_first = datetime(year, 3, 1, tzinfo=timezone.utc)
    november_first = datetime(year, 11, 1, tzinfo=timezone.utc)
    dst_start_day = 1 + ((6 - march_first.weekday()) % 7) + 7  # second Sunday in March
    dst_end_day = 1 + ((6 - november_first.weekday()) % 7)  # first Sunday in November
    # Transitions happen at 02:00 local: 07:00 UTC in March and 06:00 UTC in November.
    dst_start = datetime(year, 3, dst_start_day, 7, tzinfo=timezone.utc)
    dst_end = datetime(year, 11, dst_end_day, 6, tzinfo=timezone.utc)
    return dst_start <= now_utc < dst_end

# --- General Key-Value Cache Helpers ---
def _get_cache_value(db: Session, key: str, ttl_minutes: int) -> Optional[Any]:
    cached = db.query(MarketCache).filter(MarketCache.key == key).first()
    if cached:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=ttl_minutes)
        updated_at = cached.updated_at
        # Some database drivers return TIMESTAMP values without tzinfo even
        # when the column is declared timezone-aware. Treat those as UTC so
        # they can be compared safely with the UTC cutoff.
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        else:
            updated_at = updated_at.astimezone(timezone.utc)
        if updated_at >= cutoff:
            try:
                return json.loads(cached.value)
            except Exception:
                pass
    return None

def _set_cache_value(db: Session, key: str, value: Any, ttl_minutes: int = CACHE_TTL_MINUTES):
    try:
        cached = db.query(MarketCache).filter(MarketCache.key == key).first()
        val_str = json.dumps(value)
        if cached:
            cached.value = val_str
            cached.updated_at = datetime.utcnow()
        else:
            cached = MarketCache(key=key, value=val_str, updated_at=datetime.utcnow())
            db.add(cached)
        db.commit()
    except Exception as e:
        logger.error("Failed to write to key-value cache for %s: %s", key, e)
        db.rollback()

# --- Database Quote Cache Helpers ---
def _get_quote_from_db(db: Session, symbol: str) -> Optional[MarketQuote]:
    """Retrieve quote from the db if updated within CACHE_TTL_MINUTES."""
    cutoff = datetime.utcnow() - timedelta(minutes=CACHE_TTL_MINUTES)
    return db.query(MarketQuote).filter(
        MarketQuote.symbol == symbol,
        MarketQuote.updated_at >= cutoff
    ).first()

def _save_quote_to_db(db: Session, symbol: str, q: Dict[str, Any], market: str, asset_type: str) -> MarketQuote:
    """Save or update quote details in database."""
    try:
        quote = db.query(MarketQuote).filter(MarketQuote.symbol == symbol).first()
        
        # Safe float conversion
        def to_float(val):
            try:
                return float(val) if val is not None else None
            except (ValueError, TypeError):
                return None

        price = to_float(q.get("price"))
        change = to_float(q.get("change"))
        change_pct = to_float(q.get("percent_change"))
        if change_pct is not None:
            # Twelve Data returns percent change as actual % (e.g. 1.25 for 1.25%). Let's convert to raw ratio (0.0125).
            change_pct = change_pct / 100.0

        prev_close = to_float(q.get("previous_close"))
        open_val = to_float(q.get("open"))
        high = to_float(q.get("high"))
        low = to_float(q.get("low"))
        volume = None
        try:
            volume = int(q.get("volume")) if q.get("volume") is not None else None
        except (ValueError, TypeError):
            pass

        # Parse timestamp
        timestamp = None
        ts_str = q.get("timestamp")
        if ts_str:
            try:
                # Twelve Data sometimes returns epoch or formatted string
                if isinstance(ts_str, int):
                    timestamp = datetime.utcfromtimestamp(ts_str)
                else:
                    timestamp = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            except Exception:
                timestamp = datetime.utcnow()

        if not quote:
            quote = MarketQuote(
                symbol=symbol,
                name=q.get("name") or symbol,
                exchange=q.get("exchange"),
                market=market,
                asset_type=asset_type,
                price=price,
                change=change,
                change_percent=change_pct,
                previous_close=prev_close,
                open=open_val,
                high=high,
                low=low,
                volume=volume,
                currency=q.get("currency") or ("INR" if market == "India" else "USD"),
                timestamp=timestamp or datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(quote)
        else:
            if q.get("name"):
                quote.name = q.get("name")
            if q.get("exchange"):
                quote.exchange = q.get("exchange")
            quote.market = market
            quote.asset_type = asset_type
            quote.price = price
            quote.change = change
            quote.change_percent = change_pct
            quote.previous_close = prev_close
            quote.open = open_val
            quote.high = high
            quote.low = low
            if volume is not None:
                quote.volume = volume
            if q.get("currency"):
                quote.currency = q.get("currency")
            if timestamp:
                quote.timestamp = timestamp
            quote.updated_at = datetime.utcnow()
            
        db.commit()
        db.refresh(quote)
        return quote
    except Exception as e:
        logger.error("Failed to save quote %s to database: %s", symbol, e)
        db.rollback()
        # Return transient model on error
        return MarketQuote(symbol=symbol, price=0.0, name=symbol, market=market, asset_type=asset_type)

# --- Service Implementation APIs ---

async def get_market_status(db: Session, force: bool = False) -> Dict[str, Any]:
    """Retrieve operational status for India and USA stock exchanges."""
    cache_key = "market_status"
    cached = None if force else _get_cache_value(db, cache_key, STATUS_CACHE_TTL_MINUTES)
    if cached:
        return cached
        
    api_key = _get_api_key()
    states = await twelve_data.fetch_market_status(api_key) if api_key else []
    
    # Fall back to each exchange's local regular trading session when an API
    # status is unavailable (for example, when no Twelve Data key is set).
    now_utc = datetime.now(timezone.utc)
    india_status = _market_status_from_hours(timedelta(hours=5, minutes=30), time(9, 15), time(15, 30))
    usa_offset = timedelta(hours=-4 if _is_us_daylight_saving(now_utc) else -5)
    usa_status = _market_status_from_hours(usa_offset, time(9, 30), time(16, 0))
    
    for state in states:
        code = state.get("code")
        status = state.get("status", "").lower()
        # Mapping to normalized statuses: "open", "closed", "pre_market", "after_hours", "unknown"
        normalized = "closed"
        if status == "open":
            normalized = "open"
        elif "pre" in status or "early" in status:
            normalized = "pre_market"
        elif "post" in status or "after" in status:
            normalized = "after_hours"
            
        if code in ["XNSE", "XBOM"] and india_status != "open":
            india_status = normalized
        elif code in ["XNYS", "XNAS"] and usa_status != "open":
            usa_status = normalized
            
    response = {
        "india": {
            "status": india_status,
            "exchange": "NSE",
            "last_updated": datetime.utcnow().isoformat()
        },
        "usa": {
            "status": usa_status,
            "exchange": "NYSE",
            "last_updated": datetime.utcnow().isoformat()
        }
    }
    
    _set_cache_value(db, cache_key, response)
    return response

async def get_indices(db: Session, force: bool = False) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch indices for India, USA, and Global sections."""
    # List of indices to fetch
    targets = {
        "india": [(symbol, "index") for symbol in INDIA_INDEX_NAMES],
        "usa": [("SPX", "index"), ("COMP", "index"), ("DJI", "index")],
        "global_markets": [("VIX", "index"), ("USDINR", "forex"), ("EURUSD", "forex"), ("GOLD", "commodity"), ("CRUDE", "commodity")]
    }
    
    api_key = _get_api_key()
    all_symbols = []
    for section, items in targets.items():
        all_symbols.extend([sym for sym, _ in items])
        
    # Fetch batch quotes from Twelve Data
    batch_data = {}
    stale_or_missing = []
    
    # First check cached DB entries
    for symbol in all_symbols:
        cached = None if force else _get_quote_from_db(db, symbol)
        if cached:
            # Convert DB model to normalized dict format
            batch_data[symbol] = cached
        else:
            stale_or_missing.append(symbol)
            
    # Yahoo Finance covers the dashboard's indices, forex, and commodities
    # without an API key. Twelve Data remains a secondary source if Yahoo is
    # temporarily unavailable for a symbol.
    if stale_or_missing:
        logger.info("Indices cache stale/missing. Fetching from Yahoo Finance: %s", stale_or_missing)
        yahoo_quotes = await yahoo_finance.fetch_batch_quotes(stale_or_missing)
        twelve_quotes = {}
        missing_from_yahoo = [symbol for symbol in stale_or_missing if symbol not in yahoo_quotes]
        if missing_from_yahoo and api_key:
            twelve_quotes = await twelve_data.fetch_batch_quotes(api_key, missing_from_yahoo)

        for sym in stale_or_missing:
            td_sym = twelve_data.get_td_symbol(sym)
            q = yahoo_quotes.get(sym) or twelve_quotes.get(td_sym)
            # Find item mapping details
            market = "India" if sym in INDIA_INDEX_NAMES else ("USA" if sym in ["SPX", "COMP", "DJI"] else "Global")
            asset_type = "index"
            for s, items in targets.items():
                for s_name, a_type in items:
                    if s_name == sym:
                        asset_type = a_type
            
            if q and q.get("price"):
                # Save to database
                db_quote = _save_quote_to_db(db, sym, q, market, asset_type)
                batch_data[sym] = db_quote
            else:
                logger.warning("No provider quote is available for index %s", sym)
                    
    # Format and group response
    result = {"india": [], "usa": [], "global_markets": []}
    
    for section, items in targets.items():
        for sym, _ in items:
            q = batch_data.get(sym)
            if q:
                result[section].append({
                    "symbol": q.symbol,
                    "name": INDIA_INDEX_NAMES.get(sym, q.name),
                    "value": q.price or 0.0,
                    "change": q.change or 0.0,
                    "change_percent": (q.change_percent * 100.0) if q.change_percent else 0.0,
                    "currency": q.currency or "USD",
                    "market": q.market or "Global",
                    "timestamp": q.timestamp
                })
                
    return result



async def get_quote(db: Session, symbol: str) -> Optional[MarketQuote]:
    """Fetch single stock/asset quote with db caching.
    
    Priority order:
      1. DB cache (fresh within CACHE_TTL_MINUTES)
      2. Yahoo Finance (free, no API key needed, works for equities + indices)
      3. Twelve Data (requires API key, secondary source)
      4. No quote when providers have no verified data
    """
    from app.models.stock import Stock

    requested_symbol = symbol.strip().upper()
    normalized_symbol = requested_symbol
    stock = db.query(Stock).filter(
        (Stock.ticker == normalized_symbol) | (Stock.symbol == normalized_symbol)
    ).first()
    if stock:
        symbol = stock.symbol
        twelve_symbol = f"{stock.ticker}:{stock.exchange}"
    elif normalized_symbol.endswith(":NSE"):
        symbol = f"{normalized_symbol[:-4]}.NS"
        twelve_symbol = normalized_symbol
    elif normalized_symbol.endswith(":BSE"):
        symbol = f"{normalized_symbol[:-4]}.BO"
        twelve_symbol = normalized_symbol
    elif normalized_symbol.endswith(".NS"):
        twelve_symbol = f"{normalized_symbol[:-3]}:NSE"
    elif normalized_symbol.endswith(".BO"):
        twelve_symbol = f"{normalized_symbol[:-3]}:BSE"
    else:
        twelve_symbol = requested_symbol

    cached = _get_quote_from_db(db, symbol)
    if cached:
        return cached

    sym_upper = symbol.upper()
    market = "India" if sym_upper in INDIA_INDEX_NAMES or sym_upper.endswith((".NS", ".BO")) else "USA"
    asset_type = "equity"
    if "/" in symbol or sym_upper in ["EURUSD", "USDINR", "GBPUSD", "USDJPY"]:
        asset_type = "forex"
        market = "Global"
    elif sym_upper in ["GOLD", "SILVER", "CRUDE", "GAS"]:
        asset_type = "commodity"
        market = "Global"
    elif sym_upper in ["SPX", "COMP", "DJI", "VIX", "NIFTY50", "BANKNIFTY", "SENSEX"]:
        asset_type = "index"

    # 1. Try Yahoo Finance first (free, no rate limits)
    q = await yahoo_finance.fetch_quote(sym_upper)
    if q and q.get("price"):
        return _save_quote_to_db(db, symbol, q, market, asset_type)

    # 2. Fall back to Twelve Data
    api_key = _get_api_key()
    if api_key:
        q = await twelve_data.fetch_quote(api_key, twelve_symbol)
        if q and q.get("price"):
            return _save_quote_to_db(db, symbol, q, market, asset_type)

    return None


async def get_movers(db: Session, market: str, force: bool = False) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch top gainers, top losers, and most active assets for a market (india / usa)."""
    cache_key = f"movers_v2_{market.lower()}"
    cached = None if force else _get_cache_value(db, cache_key, CACHE_TTL_MINUTES)
    if cached:
        return cached
        
    # Standard popular tickers universe
    symbols = POPULAR_IN_STOCKS if market.lower() == "india" else POPULAR_US_STOCKS
    
    api_key = _get_api_key()
    quotes = {}
    
    # Fetch from Twelve Data
    if api_key:
        quotes = await twelve_data.fetch_batch_quotes(api_key, symbols)

    yahoo_symbols = {
        sym: sym.replace(":NSE", ".NS") if market.lower() == "india" else sym
        for sym in symbols
    }
    yahoo_quotes = await yahoo_finance.fetch_batch_quotes(list(yahoo_symbols.values()))
        
    movers_list = []
    for sym in symbols:
        td_sym = twelve_data.get_td_symbol(sym)
        q = quotes.get(td_sym) or yahoo_quotes.get(yahoo_symbols[sym])
        if q and q.get("price"):
            try:
                change_pct = float(q.get("percent_change", 0))
                price = float(q.get("price", 0))
                change = float(q.get("change", 0))
                volume = int(q.get("volume", 0))
                movers_list.append({
                    "symbol": sym.split(":")[0],
                    "name": q.get("name") or sym.split(":")[0],
                    "price": price,
                    "change": change,
                    "change_percent": change_pct,
                    "volume": volume,
                    "exchange": q.get("exchange", "NSE" if market.lower() == "india" else "NASDAQ")
                })
            except Exception:
                pass
                
    # Sort
    gainers = sorted([m for m in movers_list if m["change_percent"] > 0], key=lambda x: x["change_percent"], reverse=True)
    losers = sorted([m for m in movers_list if m["change_percent"] < 0], key=lambda x: x["change_percent"])
    active = sorted(movers_list, key=lambda x: x["volume"], reverse=True)
    
    response = {
        "gainers": gainers[:5],
        "losers": losers[:5],
        "active": active[:5]
    }
    
    _set_cache_value(db, cache_key, response)
    return response

async def get_sectors(db: Session, market: str, force: bool = False) -> List[Dict[str, Any]]:
    """Return sector performances for the market (US / India)."""
    api_key = _get_api_key()
    cache_key = f"sectors_v3_{market.lower()}"
    cached = None if force else _get_cache_value(db, cache_key, CACHE_TTL_MINUTES)
    if cached:
        return cached

    if market.lower() == "india":
        quotes = await yahoo_finance.fetch_batch_quotes([symbol for _, symbol in INDIA_SECTOR_INDICES])
        response = []
        for sector, symbol in INDIA_SECTOR_INDICES:
            quote = quotes.get(symbol)
            if quote and quote.get("price") is not None:
                response.append({
                    "sector": sector,
                    "change_percent": float(quote.get("percent_change", 0.0)),
                    "market": "india",
                    "timestamp": datetime.utcnow(),
                })
        _set_cache_value(db, cache_key, response)
        return response
        
    response = []
    
    if api_key:
        # Call Twelve Data SECTOR endpoint
        url = f"{twelve_data.TD_BASE_URL}/sectors"
        params = {"apikey": api_key}
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                if "status" not in data or data["status"] != "error":
                    sectors_raw = data.get("sectors", [])
                    for item in sectors_raw:
                        try:
                            change_percent = float(str(item.get("change_percent", "0")).rstrip("%"))
                        except (TypeError, ValueError):
                            logger.warning("Skipping sector with invalid change_percent: %s", item)
                            continue
                        response.append({
                            "sector": item.get("name"),
                            "change_percent": change_percent,
                            "market": market,
                            "timestamp": datetime.utcnow()
                        })
        except Exception:
            pass

    # Also serialize any datetime timestamps from real API data
    for sec in response:
        if isinstance(sec.get("timestamp"), datetime):
            sec["timestamp"] = sec["timestamp"].isoformat()

    _set_cache_value(db, cache_key, response)
    return response


def get_market_strength(db: Session) -> Dict[str, Any]:
    """Calculate daily NSE EQ breadth and top sector participation from NSE Indices constituents."""
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    start_date = today - timedelta(days=10)
    cache_key = f"market_strength_nse_v4_{today.isoformat()}"
    cached = _get_cache_value(db, cache_key, 30)
    if cached:
        return cached

    breadth = nse_market.fetch_market_breadth_history(start_date, today)
    response = {"market": breadth["market"], "sectors": breadth["sectors"],
                "coverage": breadth["coverage"], "source": breadth["source"],
                "latest_market_date": breadth["latest_market_date"],
                "sector_coverage": breadth["sector_coverage"]}
    _set_cache_value(db, cache_key, response, ttl_minutes=30)
    return response

async def get_history(
    db: Session, 
    symbol: str, 
    interval: str = "1day", 
    outputsize: int = 100,
    force: bool = False
) -> List[Dict[str, Any]]:
    """Fetch historical OHLCV data for an asset with local key-value caching."""
    cache_key = f"history_v2_{symbol}_{interval}_{outputsize}"
    cached = None if force else _get_cache_value(db, cache_key, HISTORY_CACHE_TTL_MINUTES)
    if cached:
        return cached
        
    api_key = _get_api_key()
    yahoo_symbol = symbol.upper().replace(":NSE", ".NS").replace(":BSE", ".BO")
    history = await yahoo_finance.fetch_history(yahoo_symbol, interval, outputsize)
    if not history and api_key:
        history = await twelve_data.fetch_history(api_key, symbol, interval, outputsize)
    
    response = []
    for pt in history:
        try:
            # Twelve Data returns timestamps as format "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
            ts_str = pt.get("datetime")
            if not isinstance(ts_str, str) or not ts_str:
                continue
            if " " not in ts_str:
                ts_str += " 16:00:00"  # standard close time for index close
            ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
            
            response.append({
                "timestamp": ts,
                "open": float(pt.get("open")),
                "high": float(pt.get("high")),
                "low": float(pt.get("low")),
                "close": float(pt.get("close")),
                "volume": int(pt.get("volume") or 0)
            })
        except Exception:
            pass
            
    # Sort chronological
    response.sort(key=lambda x: x["timestamp"])
    
    # Serialize timestamps to ISO strings for JSON compatibility
    for pt in response:
        if isinstance(pt.get("timestamp"), datetime):
            pt["timestamp"] = pt["timestamp"].isoformat()
            
    _set_cache_value(db, cache_key, response)
    return response

async def search_market(db: Session, query: str) -> Dict[str, List[Dict[str, Any]]]:
    """Search Twelve Data symbols and categorize results."""
    api_key = _get_api_key()
    results = await twelve_data.fetch_search(api_key, query) if api_key else []
    
    equities = []
    indices = []
    forex = []
    commodities = []
    
    for item in results:
        sym = item.get("symbol", "")
        name = item.get("instrument_name", "")
        exchange = item.get("exchange", "")
        itype = item.get("instrument_type", "").lower()
        
        normalized_item = {
            "symbol": sym,
            "name": name or sym,
            "exchange": exchange,
            "type": "equity"
        }
        
        if "index" in itype:
            normalized_item["type"] = "index"
            indices.append(normalized_item)
        elif "forex" in itype or "currency" in itype or "/" in sym:
            normalized_item["type"] = "forex"
            forex.append(normalized_item)
        elif "commodity" in itype:
            normalized_item["type"] = "commodity"
            commodities.append(normalized_item)
        else:
            normalized_item["type"] = "equity"
            equities.append(normalized_item)
            
    return {
        "equities": equities[:10],
        "indices": indices[:10],
        "forex": forex[:10],
        "commodities": commodities[:10]
    }

async def get_forex(db: Session) -> List[Dict[str, Any]]:
    """Return forex quotes for major global currency pairs."""
    pairs = ["USDINR", "EURUSD", "GBPUSD", "USDJPY"]
    indices_data = await get_indices(db)
    global_items = indices_data.get("global_markets", [])
    
    response = []
    for pair in pairs:
        # Check in global_markets list first
        match = next((item for item in global_items if item["symbol"] == pair), None)
        if match:
            response.append({
                "pair": match["name"],
                "rate": match["value"],
                "change": match["change"],
                "change_percent": match["change_percent"]
            })
        else:
            # Fallback direct quote
            quote = await get_quote(db, pair)
            if quote:
                response.append({
                    "pair": quote.name or pair,
                    "rate": quote.price or 0.0,
                    "change": quote.change or 0.0,
                    "change_percent": (quote.change_percent * 100.0) if quote.change_percent else 0.0
                })
    return response

async def get_commodities(db: Session) -> List[Dict[str, Any]]:
    """Return commodities quotes."""
    commods = ["GOLD", "CRUDE"]
    indices_data = await get_indices(db)
    global_items = indices_data.get("global_markets", [])
    
    response = []
    for c in commods:
        match = next((item for item in global_items if item["symbol"] == c), None)
        if match:
            response.append({
                "name": match["name"],
                "price": match["value"],
                "change": match["change"],
                "change_percent": match["change_percent"]
            })
        else:
            quote = await get_quote(db, c)
            if quote:
                response.append({
                    "name": quote.name or c,
                    "price": quote.price or 0.0,
                    "change": quote.change or 0.0,
                    "change_percent": (quote.change_percent * 100.0) if quote.change_percent else 0.0
                })
    return response

async def get_market_signals(db: Session) -> List[Dict[str, Any]]:
    """Calculate deterministic market signals from current indices quotes."""
    indices_data = await get_indices(db)
    
    signals = []
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # The dashboard's signals are scoped to Indian market indices.
    all_items = indices_data.get("india", [])
        
    for item in all_items:
        val = item["value"]
        change = item["change"]
        pct = item["change_percent"]  # Already in % units e.g. 0.74 means +0.74%
        sym = item["symbol"]
        name = item["name"]
        
        # Calculate a deterministic signal based on the quote changes
        if pct > 1.5:
            signals.append({
                "asset": name,
                "signal": "Strong Momentum",
                "strength": int(min(70 + (pct * 8), 98)),
                "reason": f"{name} is surging {pct:+.2f}% today, trading well above its opening levels with strong volume pressure.",
                "timestamp": now
            })
        elif pct > 0.3:
            signals.append({
                "asset": name,
                "signal": "Bullish Trend",
                "strength": int(min(55 + (pct * 12), 75)),
                "reason": f"{name} shows healthy upward momentum at {pct:+.2f}%, holding above yesterday's close.",
                "timestamp": now
            })
        elif pct < -1.5:
            signals.append({
                "asset": name,
                "signal": "Bearish Pressure",
                "strength": int(min(70 + (abs(pct) * 8), 98)),
                "reason": f"{name} is under selling pressure at {pct:+.2f}%, with rising intraday volatility.",
                "timestamp": now
            })
        elif pct < -0.3:
            signals.append({
                "asset": name,
                "signal": "Soft Volatility",
                "strength": int(min(55 + (abs(pct) * 12), 75)),
                "reason": f"{name} is sliding {pct:+.2f}% lower, undergoing minor consolidative profit-taking.",
                "timestamp": now
            })
        else:
            signals.append({
                "asset": name,
                "signal": "Neutral Consolidation",
                "strength": 50,
                "reason": f"{name} is consolidating near {val:,.2f} (change: {pct:+.2f}%) with contained trading bandwidth.",
                "timestamp": now
            })
            
    # Sort signals by strength desc
    signals.sort(key=lambda x: x["strength"], reverse=True)
    return signals
