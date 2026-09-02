"""
Yahoo Finance provider -- free, no API key required.
Used for index quotes (S&P 500, NASDAQ, Dow Jones, NIFTY50, SENSEX, VIX, Forex, Commodities)
since these are not available on the Twelve Data free tier.
"""

import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

YF_BASE_PRIMARY = "https://query1.finance.yahoo.com"
YF_BASE_SECONDARY = "https://query2.finance.yahoo.com"
YF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SYMBOL_MAP: Dict[str, str] = {
    "NIFTY50":   "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "SENSEX":    "^BSESN",
    "SPX":       "^GSPC",
    "COMP":      "^NDX",
    "DJI":       "^DJI",
    "VIX":       "^VIX",
    "USDINR":    "USDINR=X",
    "EURUSD":    "EURUSD=X",
    "GBPUSD":    "GBPUSD=X",
    "USDJPY":    "USDJPY=X",
    "GOLD":      "GC=F",
    "SILVER":    "SI=F",
    "CRUDE":     "CL=F",
    "GAS":       "NG=F",
}


def get_yf_symbol(symbol: str) -> str:
    return SYMBOL_MAP.get(symbol.upper(), symbol)


async def fetch_quote(symbol: str, client: Optional[httpx.AsyncClient] = None) -> Optional[Dict[str, Any]]:
    yf_sym = get_yf_symbol(symbol)
    params = {"interval": "1d", "range": "2d"}
    
    for base_url in (YF_BASE_PRIMARY, YF_BASE_SECONDARY):
        url = f"{base_url}/v8/finance/chart/{yf_sym}"
        try:
            if client is not None:
                resp = await client.get(url, params=params)
            else:
                async with httpx.AsyncClient(timeout=5.0, headers=YF_HEADERS, follow_redirects=True) as c:
                    resp = await c.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            result = data.get("chart", {}).get("result")
            if not result:
                continue
            meta = result[0].get("meta", {})
            price = meta.get("regularMarketPrice") or meta.get("previousClose")
            prev  = meta.get("previousClose") or meta.get("chartPreviousClose")
            if price is None:
                continue
            change = float(price) - float(prev) if prev else 0.0
            change_pct = (change / float(prev) * 100) if prev else 0.0
            return {
                "symbol": symbol,
                "name": meta.get("longName") or meta.get("shortName") or symbol,
                "price": float(price),
                "previous_close": float(prev) if prev else None,
                "change": float(change),
                "percent_change": float(change_pct),
                "currency": meta.get("currency", "USD"),
                "exchange": meta.get("exchangeName", ""),
                "timestamp": meta.get("regularMarketTime"),
            }
        except Exception:
            continue
            
    logger.debug("Yahoo Finance quote unavailable for %s", symbol)
    return None


async def fetch_batch_quotes(symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    if not symbols:
        return {}
    async with httpx.AsyncClient(timeout=5.0, headers=YF_HEADERS, follow_redirects=True) as client:
        async def _fetch_one(sym: str):
            q = await fetch_quote(sym, client=client)
            return sym, q
        tasks = [_fetch_one(sym) for sym in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out = {}
        for item in results:
            if isinstance(item, Exception):
                continue
            sym, q = item
            if q:
                out[sym] = q
        return out


async def fetch_history(symbol: str, interval: str = "1day", outputsize: int = 100) -> List[Dict[str, Any]]:
    yf_sym = get_yf_symbol(symbol)
    interval_map = {
        "1min": "1m", "5min": "5m", "15min": "15m",
        "30min": "30m", "1h": "1h", "1day": "1d", "1week": "1wk",
    }
    yf_interval = interval_map.get(interval, "1d")
    if yf_interval in ("1m", "5m", "15m", "30m"):
        range_str = "7d"
    elif yf_interval == "1h":
        range_str = f"{max(1, min(outputsize // 6, 730))}d"
    elif yf_interval == "1d":
        range_str = f"{max(1, min(outputsize, 1825))}d"
    else:
        range_str = f"{max(7, min(outputsize * 7, 3650))}d"
    params = {"interval": yf_interval, "range": range_str}
    
    for base_url in (YF_BASE_PRIMARY, YF_BASE_SECONDARY):
        url = f"{base_url}/v8/finance/chart/{yf_sym}"
        try:
            async with httpx.AsyncClient(timeout=5.0, headers=YF_HEADERS, follow_redirects=True) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
            result = data.get("chart", {}).get("result")
            if not result:
                continue
            timestamps = result[0].get("timestamp", [])
            q_list = result[0].get("indicators", {}).get("quote", [{}])[0]
            opens   = q_list.get("open",   [])
            highs   = q_list.get("high",   [])
            lows    = q_list.get("low",    [])
            closes  = q_list.get("close",  [])
            volumes = q_list.get("volume", [])
            points = []
            for i, ts in enumerate(timestamps):
                close = closes[i] if i < len(closes) else None
                if close is None:
                    continue
                dt_str = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
                points.append({
                    "datetime": dt_str,
                    "open":   str(opens[i])   if i < len(opens)   and opens[i]   is not None else None,
                    "high":   str(highs[i])   if i < len(highs)   and highs[i]   is not None else None,
                    "low":    str(lows[i])    if i < len(lows)    and lows[i]    is not None else None,
                    "close":  str(close),
                    "volume": str(volumes[i]) if i < len(volumes) and volumes[i] is not None else None,
                })
            points.reverse()
            return points[:outputsize]
        except Exception:
            continue
            
    logger.debug("Yahoo Finance history unavailable for %s", symbol)
    return []

