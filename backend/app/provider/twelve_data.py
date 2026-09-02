"""
Twelve Data provider layer.
Handles requests to the Twelve Data REST API.
Endpoints utilized:
  - /quote
  - /time_series
  - /market_state
  - /symbol_search
"""

import logging
from typing import Optional, List, Dict, Any
import httpx

logger = logging.getLogger(__name__)

TD_BASE_URL = "https://api.twelvedata.com"

# FinPilot symbol mapping to Twelve Data symbols
SYMBOL_MAP = {
    # Indian Indices
    "NIFTY50": "NIFTY50",
    "BANKNIFTY": "BANKNIFTY",
    "SENSEX": "BSESN",
    # US Indices
    "SPX": "SPX",
    "COMP": "IXIC",
    "DJI": "DJI",
    # Global/Others
    "VIX": "VIX",
    "USDINR": "USD/INR",
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "GOLD": "XAU/USD",
    "CRUDE": "CL:NYM"
}

# Reverse map for normalization
REVERSE_SYMBOL_MAP = {v: k for k, v in SYMBOL_MAP.items()}

def get_td_symbol(symbol: str) -> str:
    """Translate FinPilot symbol to Twelve Data symbol."""
    upper = symbol.upper().replace("/", "").replace("_", "")
    return SYMBOL_MAP.get(upper, symbol)

def get_finpilot_symbol(td_symbol: str) -> str:
    """Translate Twelve Data symbol back to FinPilot symbol."""
    return REVERSE_SYMBOL_MAP.get(td_symbol, td_symbol)

async def fetch_market_status(api_key: str) -> List[Dict[str, Any]]:
    """Fetch status of all exchanges via /market_state."""
    url = f"{TD_BASE_URL}/market_state"
    params = {"apikey": api_key}
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if "status" in data and data["status"] == "error":
                logger.error("Twelve Data status error: %s", data.get("message"))
                return []
            return data if isinstance(data, list) else []
    except Exception as exc:
        logger.error("Twelve Data status request failed: %s", exc)
        return []

async def fetch_quote(api_key: str, symbol: str) -> Optional[Dict[str, Any]]:
    """Fetch real-time quote for a single symbol."""
    td_symbol = get_td_symbol(symbol)
    url = f"{TD_BASE_URL}/quote"
    params = {"symbol": td_symbol, "apikey": api_key}
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if "status" in data and data["status"] == "error":
                logger.warning("Twelve Data quote error for %s: %s", symbol, data.get("message"))
                return None
            return data
    except Exception as exc:
        logger.error("Twelve Data quote fetch failed for %s: %s", symbol, exc)
        return None

async def fetch_batch_quotes(api_key: str, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch real-time quotes for multiple symbols in a single batch query."""
    if not symbols:
        return {}
        
    td_symbols = [get_td_symbol(s) for s in symbols]
    url = f"{TD_BASE_URL}/quote"
    params = {"symbol": ",".join(td_symbols), "apikey": api_key}
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            if not data or (isinstance(data, dict) and data.get("status") == "error"):
                logger.warning("Twelve Data batch quote error: %s", data.get("message") if isinstance(data, dict) else "unknown")
                return {}
                
            # If requesting only 1 symbol, Twelve Data returns a single dict instead of a dict of dicts
            if len(td_symbols) == 1:
                symbol_key = td_symbols[0]
                return {symbol_key: data} if "symbol" in data else {}
                
            return data
    except Exception as exc:
        logger.error("Twelve Data batch quote fetch failed: %s", exc)
        return {}

async def fetch_history(
    api_key: str, 
    symbol: str, 
    interval: str = "1day", 
    outputsize: int = 100
) -> List[Dict[str, Any]]:
    """Fetch historical OHLCV data."""
    td_symbol = get_td_symbol(symbol)
    url = f"{TD_BASE_URL}/time_series"
    params = {
        "symbol": td_symbol,
        "interval": interval,
        "outputsize": str(outputsize),
        "apikey": api_key
    }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            if "status" in data and data["status"] == "error":
                logger.warning("Twelve Data history error for %s: %s", symbol, data.get("message"))
                return []
                
            values = data.get("values", [])
            return values
    except Exception as exc:
        logger.error("Twelve Data history fetch failed for %s: %s", symbol, exc)
        return []

async def fetch_search(api_key: str, query: str) -> List[Dict[str, Any]]:
    """Search for symbols matching query."""
    url = f"{TD_BASE_URL}/symbol_search"
    params = {"symbol": query, "apikey": api_key}
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if "status" in data and data["status"] == "error":
                logger.warning("Twelve Data search error: %s", data.get("message"))
                return []
            return data.get("data", [])
    except Exception as exc:
        logger.error("Twelve Data search failed: %s", exc)
        return []
