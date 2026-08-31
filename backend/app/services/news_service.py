"""
News service — coordinates fetching from Alpha Vantage and caching in SQLite.

Strategy:
  1. Query DB for articles newer than CACHE_TTL_MINUTES.
  2. If we have enough fresh articles, return them directly.
  3. Otherwise hit Alpha Vantage, upsert results, then return.

This keeps us inside the AV free-tier (25 req/day) while always showing
real data to the user.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.database import settings

logger = logging.getLogger(__name__)

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.news import NewsArticle
from app.provider.alpha_vantage import fetch_news

# ── Cache configuration ──────────────────────────────────────────────────────
CACHE_TTL_MINUTES: int = 30          # Refresh from API if cache is older than this
MIN_FRESH_ARTICLES: int = 5          # Minimum articles before we skip an API call


def _get_api_key() -> Optional[str]:
    """Read ALPHA_VANTAGE_KEY from pydantic settings (loaded from .env)."""
    key = settings.ALPHA_VANTAGE_KEY
    return key if key and key != "demo" else None


def _cache_is_fresh(db: Session) -> bool:
    """Return True if we have enough recent articles within CACHE_TTL_MINUTES.
    
    SQLite stores datetimes as naive UTC strings, so we compare against
    datetime.utcnow() (also naive) to avoid timezone-aware vs naive mismatch.
    """
    cutoff = datetime.utcnow() - timedelta(minutes=CACHE_TTL_MINUTES)
    count = (
        db.query(NewsArticle)
        .filter(NewsArticle.fetched_at >= cutoff)
        .count()
    )
    return count >= MIN_FRESH_ARTICLES


def _upsert_articles(db: Session, raw_articles: list[dict]) -> None:
    """Insert new articles, skip duplicates (by URL)."""
    for art in raw_articles:
        url = art.get("url")
        if not url:
            continue
        exists = db.query(NewsArticle).filter(NewsArticle.url == url).first()
        if exists:
            continue  # Already cached
        db.add(NewsArticle(**art))
    db.commit()


async def get_news(
    db: Session,
    topic: Optional[str] = None,
    ticker: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
) -> tuple[list[NewsArticle], int]:
    """
    Main entry point for the news router.

    Returns (articles, total_count).
    """
    api_key = _get_api_key()

    # Attempt live refresh when cache is stale and we have a key
    if api_key and not _cache_is_fresh(db):
        logger.info("Cache stale — fetching fresh news from Alpha Vantage")
        try:
            raw = await fetch_news(
                api_key=api_key,
                tickers=ticker,
                topics=topic.lower() if topic else None,
                limit=50,
            )
            if raw:
                _upsert_articles(db, raw)
                logger.info("Upserted %d articles from Alpha Vantage", len(raw))
            else:
                logger.warning("Alpha Vantage returned 0 articles")
        except Exception as exc:
            logger.error("Alpha Vantage fetch failed: %s", exc)

    # Query DB (always — even if AV call failed we'll return whatever is cached)
    query = db.query(NewsArticle).order_by(desc(NewsArticle.published_at))

    if topic and topic.lower() != "all":
        query = query.filter(NewsArticle.topic.ilike(f"%{topic}%"))
    if ticker:
        query = query.filter(NewsArticle.ticker.ilike(f"%{ticker}%"))

    total = query.count()
    articles = query.offset(skip).limit(limit).all()

    return articles, total
