from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from app.database import Base


class MarketCache(Base):
    """Generic key-value cache for market data (sectors, movers, status, etc.)."""
    __tablename__ = "market_cache"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(200), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)   # JSON-serialised payload
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketQuote(Base):
    """Cached real-time quote for a single ticker / index / forex / commodity."""
    __tablename__ = "market_quotes"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=True)
    exchange = Column(String(100), nullable=True)
    market = Column(String(50), nullable=True)          # e.g. "India", "USA", "Global"
    asset_type = Column(String(50), nullable=True)      # "equity", "index", "forex", "commodity"

    price = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)       # stored as raw ratio, e.g. 0.0125 = 1.25%
    previous_close = Column(Float, nullable=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    market_cap = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)

    timestamp = Column(DateTime, nullable=True)         # exchange timestamp of the quote
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
