"""
News router — mounted at /api/v1/news in main.py.

Endpoints
---------
GET /api/v1/news/               — paginated list (filter by topic / ticker)
GET /api/v1/news/topics         — list of distinct topics in the DB
GET /api/v1/news/sentiment      — aggregate sentiment summary
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.schemas.news import NewsArticleOut, NewsListResponse
from app.services.news_service import get_news
from app.models.news import NewsArticle

router = APIRouter(prefix="/api/v1/news", tags=["Market News"])


@router.get("/", response_model=NewsListResponse)
async def list_news(
    topic: str | None = Query(None, description="Filter by topic, e.g. 'Earnings'"),
    ticker: str | None = Query(None, description="Filter by ticker, e.g. 'AAPL'"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return a paginated list of market news articles."""
    articles, total = await get_news(db, topic=topic, ticker=ticker, limit=limit, skip=skip)
    return NewsListResponse(
        articles=articles,
        total=total,
        topic=topic,
        ticker=ticker,
    )


@router.get("/topics", response_model=list[str])
def list_topics(db: Session = Depends(get_db)):
    """Return all distinct topics present in the cached articles."""
    rows = (
        db.query(NewsArticle.topic)
        .filter(NewsArticle.topic.isnot(None))
        .distinct()
        .all()
    )
    return sorted({r[0] for r in rows})


@router.get("/sentiment")
def sentiment_summary(db: Session = Depends(get_db)):
    """
    Return aggregate sentiment counts + percentages.
    Used by the Sentiment widget on the frontend.
    """
    rows = (
        db.query(NewsArticle.overall_sentiment_label, func.count())
        .filter(NewsArticle.overall_sentiment_label.isnot(None))
        .group_by(NewsArticle.overall_sentiment_label)
        .all()
    )

    total = sum(count for _, count in rows)
    data = []
    color_map = {
        "Bullish": "#137333",
        "Somewhat-Bullish": "#34A853",
        "Neutral": "#8C8C8C",
        "Somewhat-Bearish": "#EA8600",
        "Bearish": "#C5221F",
    }
    for label, count in rows:
        pct = round((count / total * 100) if total else 0, 1)
        data.append({"label": label, "count": count, "pct": pct, "color": color_map.get(label, "#8C8C8C")})

    # Sort by pct desc
    data.sort(key=lambda x: x["pct"], reverse=True)

    overall = data[0]["label"] if data else "Neutral"

    return {"total_articles": total, "breakdown": data, "overall": overall}
