"""
Alpha Vantage market-data provider.

Endpoints used (all free-tier):
  - GLOBAL_QUOTE          → real-time quote for a symbol
  - SECTOR                → sector performance (daily / weekly / monthly)
  - TOP_GAINERS_LOSERS    → top gainers, losers, most active (premium only — we fall back)

Free-tier note: 25 req/day.  We cache aggressively in SQLite so we
never burn the quota on repeated page loads.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

AV_BASE = "https://www.alphavantage.co/query"

# Proxy symbols for major indices (AV doesn't serve index futures directly,
# but SPY/QQQ/DIA/IWM are highly correlated ETFs available on GLOBAL_QUOTE)
INDEX_SYMBOLS = {
    "S&P 500":     "SPY",
    "Nasdaq 100":  "QQQ",
    "Dow Jones":   "DIA",
    "Russell 2000": "IWM",
}


async def _quote(client: httpx.AsyncClient, api_key: str, symbol: str) -> Optional[dict]:
    """Fetch a single GLOBAL_QUOTE and return normalised dict or None."""
    try:
        resp = await client.get(AV_BASE, params={
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": api_key,
        })
        resp.raise_for_status()
        data = resp.json()

        # Rate-limit / error detection
        if "Note" in data or "Information" in data or "Error Message" in data:
            logger.warning("AV API issue for %s: %s", symbol, data)
            return None

        gq = data.get("Global Quote", {})
        if not gq or not gq.get("05. price"):
            return None

        price = float(gq["05. price"])
        change = float(gq["09. change"])
        change_pct = float(gq["10. change percent"].rstrip("%"))
        prev_close = float(gq["08. previous close"])
        volume = int(gq.get("06. volume", 0))

        return {
            "symbol": symbol,
            "price": round(price, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 4),
            "prev_close": round(prev_close, 2),
            "volume": volume,
            "is_positive": change >= 0,
        }
    except Exception as exc:
        logger.error("GLOBAL_QUOTE error for %s: %s", symbol, exc)
        return None


async def fetch_indices(api_key: str) -> list[dict]:
    """
    Return live quotes for the 4 proxy ETFs representing major indices.
    Fires all 4 requests concurrently to minimise latency.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        tasks = [_quote(client, api_key, sym) for sym in INDEX_SYMBOLS.values()]
        results = await asyncio.gather(*tasks)

    out = []
    for (name, _sym), quote in zip(INDEX_SYMBOLS.items(), results):
        if quote:
            out.append({**quote, "name": name})

    return out


async def fetch_sector_performance(api_key: str) -> list[dict]:
    """
    Return sector performance from AV SECTOR endpoint.
    We use the 1-day performance column.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(AV_BASE, params={
                "function": "SECTOR",
                "apikey": api_key,
            })
            resp.raise_for_status()
            data = resp.json()

        if "Note" in data or "Information" in data:
            logger.warning("AV SECTOR rate-limited: %s", data)
            return []

        # "Rank A: Real-Time Performance" or "Rank B: 1 Day Performance"
        day_perf = data.get("Rank B: 1 Day Performance") or data.get("Rank A: Real-Time Performance", {})

        out = []
        for sector, pct_str in day_perf.items():
            try:
                pct = float(pct_str.rstrip("%"))
                out.append({"sector": sector, "change_pct": round(pct, 2)})
            except ValueError:
                continue

        # Sort descending
        out.sort(key=lambda x: x["change_pct"], reverse=True)
        return out

    except Exception as exc:
        logger.error("SECTOR fetch error: %s", exc)
        return []


async def fetch_top_movers(api_key: str, top_n: int = 5) -> dict:
    """
    Fetch top gainers, top losers, and most active stocks from the free
    TOP_GAINERS_LOSERS endpoint. Returns lists of normalised dicts.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(AV_BASE, params={
                "function": "TOP_GAINERS_LOSERS",
                "apikey": api_key,
            })
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("TOP_GAINERS_LOSERS fetch error: %s", exc)
        return {"gainers": [], "losers": [], "most_active": []}

    if "Note" in data or "Information" in data:
        logger.warning("AV TOP_GAINERS_LOSERS rate-limited: %s", data)
        return {"gainers": [], "losers": [], "most_active": []}

    def parse_item(item: dict) -> dict:
        try:
            change_pct_str = item.get("change_percentage", "0%").rstrip("%")
            return {
                "symbol": item.get("ticker", ""),
                "ticker": item.get("ticker", ""), # match both frontend expectations
                "price": float(item.get("price", 0)),
                "change": float(item.get("change_amount", 0)),
                "change_pct": round(float(change_pct_str) / 100.0, 4), # e.g. 1.25% -> 0.0125
                "volume": int(item.get("volume", 0)),
                "is_positive": float(item.get("change_amount", 0)) >= 0
            }
        except Exception:
            return {}

    gainers_raw = data.get("top_gainers", [])
    losers_raw = data.get("top_losers", [])
    active_raw = data.get("most_actively_traded", [])

    gainers = [parse_item(item) for item in gainers_raw if item][:top_n]
    losers = [parse_item(item) for item in losers_raw if item][:top_n]
    active = [parse_item(item) for item in active_raw if item][:top_n]

    # Filter out empty dicts from parsing errors
    gainers = [g for g in gainers if g]
    losers = [l for l in losers if l]
    active = [a for a in active if a]

    return {
        "gainers": gainers,
        "losers": losers,
        "most_active": active
    }

