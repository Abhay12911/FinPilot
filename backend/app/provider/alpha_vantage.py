"""
Alpha Vantage news provider.

Fetches market news & sentiment from Alpha Vantage's NEWS_SENTIMENT endpoint.
Free tier: 25 req/day — we cache results in the DB to stay within limits.

Docs: https://www.alphavantage.co/documentation/#news-sentiment
"""

import logging
import httpx
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


AV_BASE = "https://www.alphavantage.co/query"


def _parse_time(raw: str) -> Optional[datetime]:
    """Parse Alpha Vantage's YYYYMMDDTHHMMSS format."""
    try:
        return datetime.strptime(raw, "%Y%m%dT%H%M%S")
    except Exception:
        return None


async def fetch_news(
    api_key: str,
    tickers: Optional[str] = None,   # Comma-separated e.g. "AAPL,MSFT"
    topics: Optional[str] = None,     # e.g. "earnings,technology"
    limit: int = 50,
) -> list[dict]:
    """
    Call Alpha Vantage NEWS_SENTIMENT and return a normalised list of article dicts.
    Returns an empty list on any error (so the app gracefully falls back to cached data).
    """
    params = {
        "function": "NEWS_SENTIMENT",
        "apikey": api_key,
        "limit": str(limit),
        "sort": "LATEST",
    }
    if tickers:
        params["tickers"] = tickers
    if topics:
        params["topics"] = topics

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(AV_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("Alpha Vantage HTTP error: %s", exc)
        raise

    # Alpha Vantage returns 200 OK even for rate limits / invalid keys
    if "Note" in data:
        logger.warning("Alpha Vantage rate limit hit: %s", data["Note"])
        return []
    if "Information" in data:
        logger.warning("Alpha Vantage info message: %s", data["Information"])
        return []
    if "Error Message" in data:
        logger.error("Alpha Vantage error: %s", data["Error Message"])
        return []

    feed = data.get("feed", [])
    articles = []
    for item in feed:
        # Pick primary ticker from ticker_sentiment list (highest relevance)
        ticker_sentiments = item.get("ticker_sentiment", [])
        primary_ticker = None
        if ticker_sentiments:
            top = max(
                ticker_sentiments,
                key=lambda t: float(t.get("relevance_score", 0)),
                default=None,
            )
            if top:
                primary_ticker = top.get("ticker")

        # Map topic categories (AV returns a list; we take the first)
        topics_list = item.get("topics", [])
        primary_topic = topics_list[0].get("topic") if topics_list else None

        articles.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "source": item.get("source", None),
            "author": next(iter(item.get("authors", [])), None),
            "summary": item.get("summary", None),
            "banner_image": item.get("banner_image", None) or None,
            "topic": primary_topic,
            "ticker": primary_ticker,
            "overall_sentiment_label": item.get("overall_sentiment_label"),
            "overall_sentiment_score": float(item.get("overall_sentiment_score", 0)),
            "published_at": _parse_time(item.get("time_published", "")),
        })

    return articles


async def fetch_company_overview(api_key: str, symbol: str) -> Optional[dict]:
    """
    Fetch company profile & fundamentals from Alpha Vantage OVERVIEW endpoint.
    Free tier: 25 req/day.
    """
    params = {
        "function": "OVERVIEW",
        "symbol": symbol.upper(),
        "apikey": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(AV_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.error("Alpha Vantage OVERVIEW HTTP error for %s: %s", symbol, exc)
        return None

    if "Note" in data or "Information" in data or "Error Message" in data:
        logger.warning("Alpha Vantage OVERVIEW issue for %s: %s", symbol, data)
        return None

    return data

