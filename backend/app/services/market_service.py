import logging
import json
import httpx
from datetime import datetime, timedelta, time, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database import settings
from app.models.market import MarketCache, MarketQuote
from app.provider import twelve_data
from app.provider import yahoo_finance


logger = logging.getLogger(__name__)

CACHE_TTL_MINUTES = 5  # Cache quotes for 5 minutes
HISTORY_CACHE_TTL_MINUTES = 60  # Cache history for 1 hour
STATUS_CACHE_TTL_MINUTES = 15  # Cache status for 15 minutes

# Curated lists of popular equities for movers if API fails or lacks mover endpoints
POPULAR_US_STOCKS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "NFLX", "AMD", "INTC"]
POPULAR_IN_STOCKS = ["RELIANCE:NSE", "TCS:NSE", "HDFCBANK:NSE", "ICICIBANK:NSE", "INFY:NSE", "BHARTIARTL:NSE", "ITC:NSE", "SBIN:NSE", "LTIM:NSE", "TATAMOTORS:NSE"]

# Fallback values for Indices, Forex, and Commodities
FALLBACK_INDEX_QUOTES = {
    # India
    "NIFTY50": {"name": "NIFTY 50", "price": 24850.20, "change": 182.40, "change_pct": 0.0074, "currency": "INR", "market": "India"},
    "BANKNIFTY": {"name": "BANK NIFTY", "price": 51230.15, "change": 420.50, "change_pct": 0.0083, "currency": "INR", "market": "India"},
    "SENSEX": {"name": "SENSEX", "price": 81240.10, "change": 490.30, "change_pct": 0.0061, "currency": "INR", "market": "India"},
    # US
    "SPX": {"name": "S&P 500", "price": 6450.20, "change": 52.40, "change_pct": 0.0082, "currency": "USD", "market": "USA"},
    "COMP": {"name": "NASDAQ 100", "price": 21240.40, "change": 235.10, "change_pct": 0.0112, "currency": "USD", "market": "USA"},
    "DJI": {"name": "Dow Jones", "price": 44210.50, "change": 150.20, "change_pct": 0.0034, "currency": "USD", "market": "USA"},
    # Global
    "VIX": {"name": "Volatility Index", "price": 17.42, "change": -0.58, "change_pct": -0.0321, "currency": "USD", "market": "Global"},
    "USDINR": {"name": "USD/INR", "price": 83.95, "change": 0.12, "change_pct": 0.0014, "currency": "INR", "market": "Global"},
    "EURUSD": {"name": "EUR/USD", "price": 1.085, "change": -0.002, "change_pct": -0.0018, "currency": "USD", "market": "Global"},
    "GBPUSD": {"name": "GBP/USD", "price": 1.3120, "change": 0.0025, "change_pct": 0.0019, "currency": "USD", "market": "Global"},
    "USDJPY": {"name": "USD/JPY", "price": 144.50, "change": -0.85, "change_pct": -0.0058, "currency": "JPY", "market": "Global"},
    "GOLD": {"name": "Gold", "price": 2510.40, "change": 15.60, "change_pct": 0.0062, "currency": "USD", "market": "Global"},
    "SILVER": {"name": "Silver", "price": 28.95, "change": 0.42, "change_pct": 0.0147, "currency": "USD", "market": "Global"},
    "CRUDE": {"name": "Crude Oil", "price": 74.20, "change": -1.10, "change_pct": -0.0146, "currency": "USD", "market": "Global"},
    "GAS": {"name": "Natural Gas", "price": 2.15, "change": -0.08, "change_pct": -0.0358, "currency": "USD", "market": "Global"}
}

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
        cutoff = datetime.utcnow() - timedelta(minutes=ttl_minutes)
        if cached.updated_at >= cutoff:
            try:
                return json.loads(cached.value)
            except Exception:
                pass
    return None

def _set_cache_value(db: Session, key: str, value: Any):
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

def _get_stale_quote_from_db(db: Session, symbol: str) -> Optional[MarketQuote]:
    """Retrieve quote from the db regardless of age."""
    return db.query(MarketQuote).filter(MarketQuote.symbol == symbol).first()

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
            
        if code in ["XNSE", "XBOM"]:
            india_status = normalized
        elif code in ["XNYS", "XNAS"]:
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
        "india": [("NIFTY50", "index"), ("BANKNIFTY", "index"), ("SENSEX", "index")],
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
            market = "India" if sym in ["NIFTY50", "BANKNIFTY", "SENSEX"] else ("USA" if sym in ["SPX", "COMP", "DJI"] else "Global")
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
                # Call fallback database quote (even if expired)
                db_quote = _get_stale_quote_from_db(db, sym)
                if db_quote:
                    batch_data[sym] = db_quote
                else:
                    # Final mock fallback
                    fb = FALLBACK_INDEX_QUOTES.get(sym, {})
                    batch_data[sym] = MarketQuote(
                        symbol=sym,
                        name=fb.get("name", sym),
                        price=fb.get("price", 0.0),
                        change=fb.get("change", 0.0),
                        change_percent=fb.get("change_pct", 0.0),
                        currency=fb.get("currency", "USD"),
                        market=fb.get("market", "Global"),
                        timestamp=datetime.utcnow()
                    )
                    
    # Format and group response
    result = {"india": [], "usa": [], "global_markets": []}
    
    for section, items in targets.items():
        for sym, _ in items:
            q = batch_data.get(sym)
            if q:
                result[section].append({
                    "symbol": q.symbol,
                    "name": q.name,
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
      4. Stale DB record (any age, last resort)
    """
    cached = _get_quote_from_db(db, symbol)
    if cached:
        return cached

    sym_upper = symbol.upper()
    market = "India" if sym_upper in ["NIFTY50", "BANKNIFTY", "SENSEX"] else "USA"
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
        q = await twelve_data.fetch_quote(api_key, symbol)
        if q and q.get("price"):
            return _save_quote_to_db(db, symbol, q, market, asset_type)

    # 3. Return stale DB record rather than nothing
    stale = _get_stale_quote_from_db(db, symbol)
    if stale:
        return stale

    return None


async def get_movers(db: Session, market: str, force: bool = False) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch top gainers, top losers, and most active assets for a market (india / usa)."""
    cache_key = f"movers_{market.lower()}"
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
        
    movers_list = []
    for sym in symbols:
        td_sym = twelve_data.get_td_symbol(sym)
        q = quotes.get(td_sym)
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
                
    # If API fails or rate-limited, provide fallback mock movers
    if not movers_list:
        if market.lower() == "india":
            movers_list = [
                {"symbol": "RELIANCE", "name": "Reliance Industries", "price": 2980.50, "change": 45.20, "change_percent": 1.54, "volume": 5201928, "exchange": "NSE"},
                {"symbol": "TCS", "name": "Tata Consultancy Services", "price": 4120.00, "change": 85.00, "change_percent": 2.11, "volume": 1289382, "exchange": "NSE"},
                {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "price": 1640.20, "change": -22.50, "change_percent": -1.35, "volume": 8902817, "exchange": "NSE"},
                {"symbol": "INFY", "name": "Infosys Ltd", "price": 1820.40, "change": 38.10, "change_percent": 2.14, "volume": 3410291, "exchange": "NSE"},
                {"symbol": "SBIN", "name": "State Bank of India", "price": 810.15, "change": -12.40, "change_percent": -1.51, "volume": 6789102, "exchange": "NSE"}
            ]
        else:
            movers_list = [
                {"symbol": "NVDA", "name": "NVIDIA Corporation", "price": 182.45, "change": 8.45, "change_percent": 4.87, "volume": 42392821, "exchange": "NASDAQ"},
                {"symbol": "META", "name": "Meta Platforms Inc", "price": 609.30, "change": 18.90, "change_percent": 3.21, "volume": 15672901, "exchange": "NASDAQ"},
                {"symbol": "AAPL", "name": "Apple Inc", "price": 231.40, "change": -0.97, "change_percent": -0.42, "volume": 28938201, "exchange": "NASDAQ"},
                {"symbol": "TSLA", "name": "Tesla Inc", "price": 248.80, "change": -8.32, "change_percent": -3.24, "volume": 35671029, "exchange": "NASDAQ"},
                {"symbol": "INTC", "name": "Intel Corp", "price": 22.15, "change": -0.49, "change_percent": -2.18, "volume": 19827301, "exchange": "NASDAQ"}
            ]
            
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
    cache_key = f"sectors_{market.lower()}"
    cached = None if force else _get_cache_value(db, cache_key, CACHE_TTL_MINUTES)
    if cached:
        return cached
        
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

    # High-quality fallback data if API failed, was demo or returned empty list
    if not response:
        ts = datetime.utcnow().isoformat()
        if market.lower() == "india":
            response = [
                {"sector": "IT & Software", "change_percent": 1.42, "market": "india", "timestamp": ts},
                {"sector": "Banking & Finance", "change_percent": 0.82, "market": "india", "timestamp": ts},
                {"sector": "Automobile", "change_percent": 0.95, "market": "india", "timestamp": ts},
                {"sector": "Metal & Mining", "change_percent": 1.25, "market": "india", "timestamp": ts},
                {"sector": "Pharmaceuticals", "change_percent": -0.32, "market": "india", "timestamp": ts},
                {"sector": "Energy & Utilities", "change_percent": -0.62, "market": "india", "timestamp": ts}
            ]
        else:
            response = [
                {"sector": "Technology", "change_percent": 2.42, "market": "usa", "timestamp": ts},
                {"sector": "Communication Services", "change_percent": 1.15, "market": "usa", "timestamp": ts},
                {"sector": "Consumer Cyclical", "change_percent": 0.92, "market": "usa", "timestamp": ts},
                {"sector": "Industrials", "change_percent": 0.52, "market": "usa", "timestamp": ts},
                {"sector": "Financials", "change_percent": 0.38, "market": "usa", "timestamp": ts},
                {"sector": "Healthcare", "change_percent": -0.22, "market": "usa", "timestamp": ts},
                {"sector": "Energy", "change_percent": -1.24, "market": "usa", "timestamp": ts},
                {"sector": "Utilities", "change_percent": -0.32, "market": "usa", "timestamp": ts}
            ]
    # Also serialize any datetime timestamps from real API data
    for sec in response:
        if isinstance(sec.get("timestamp"), datetime):
            sec["timestamp"] = sec["timestamp"].isoformat()

    _set_cache_value(db, cache_key, response)
    return response

async def get_history(
    db: Session, 
    symbol: str, 
    interval: str = "1day", 
    outputsize: int = 100
) -> List[Dict[str, Any]]:
    """Fetch historical OHLCV data for an asset with local key-value caching."""
    cache_key = f"history_{symbol}_{interval}_{outputsize}"
    cached = _get_cache_value(db, cache_key, HISTORY_CACHE_TTL_MINUTES)
    if cached:
        return cached
        
    api_key = _get_api_key()
    history = await yahoo_finance.fetch_history(symbol, interval, outputsize)
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
    
    # If API call returned no data, provide realistic fallback history for main indices
    if not response:
        import random
        fb_quote = FALLBACK_INDEX_QUOTES.get(symbol.upper())
        current_val = fb_quote.get("price", 100.0) if fb_quote else 150.0
        now = datetime.utcnow()
        # Seed based on symbol for reproducibility
        rng = random.Random(hash(symbol) % (2**31))
        # Walk backwards from current value, skipping weekends
        days_walked = 0
        points = []
        d = now
        while days_walked < outputsize:
            d = d - timedelta(days=1)
            # Skip weekends for stock data
            if d.weekday() >= 5:
                continue
            days_walked += 1
            points.append(d)
        points.reverse()
        
        # Forward walk from a seeded starting price with upward drift
        daily_drift = 0.0003  # ~0.03% daily average gain (realistic)
        vol = 0.008  # ~0.8% daily volatility
        start_price = current_val * (1 - daily_drift * len(points))
        price = start_price
        for ts in points:
            daily_return = daily_drift + rng.gauss(0, vol)
            price = price * (1 + daily_return)
            open_p = price * (1 + rng.gauss(0, 0.002))
            high_p = max(price, open_p) * (1 + abs(rng.gauss(0, 0.003)))
            low_p = min(price, open_p) * (1 - abs(rng.gauss(0, 0.003)))
            response.append({
                "timestamp": ts.replace(hour=16, minute=0, second=0),
                "open": round(open_p, 4),
                "high": round(high_p, 4),
                "low": round(low_p, 4),
                "close": round(price, 4),
                "volume": rng.randint(1_500_000, 8_000_000)
            })

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
    
    # Process all indices from USA, India, and Global
    all_items = []
    for key in ["india", "usa", "global_markets"]:
        all_items.extend(indices_data.get(key, []))
        
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
    return signals[:6]
