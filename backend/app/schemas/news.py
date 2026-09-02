from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime


class NewsArticleOut(BaseModel):
    """Shape returned to the frontend for a single news article."""
    id: int
    title: str
    url: str
    source: Optional[str] = None
    author: Optional[str] = None
    summary: Optional[str] = None
    banner_image: Optional[str] = None
    topic: Optional[str] = None
    ticker: Optional[str] = None
    overall_sentiment_label: Optional[str] = None
    overall_sentiment_score: Optional[float] = None
    published_at: Optional[datetime] = None
    fetched_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class NewsListResponse(BaseModel):
    """Paginated news list with metadata."""
    articles: list[NewsArticleOut]
    total: int
    topic: Optional[str] = None
    ticker: Optional[str] = None
