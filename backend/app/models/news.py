from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class NewsArticle(Base):
    """Cached news articles from Alpha Vantage (or fallback)."""
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)

    # Core article fields
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False, unique=True)
    source = Column(String(100), nullable=True)
    author = Column(String(200), nullable=True)
    summary = Column(Text, nullable=True)
    banner_image = Column(String(1000), nullable=True)

    # Classification
    topic = Column(String(100), nullable=True)         # e.g. Earnings, Technology
    ticker = Column(String(20), nullable=True)          # Primary ticker mentioned

    # Sentiment
    overall_sentiment_label = Column(String(50), nullable=True)   # Positive / Neutral / Negative
    overall_sentiment_score = Column(Float, nullable=True)         # -1.0 → 1.0

    # Timestamps
    published_at = Column(DateTime(timezone=True), nullable=True)  # From provider
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())  # When we cached it
