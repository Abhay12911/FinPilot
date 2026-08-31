from sqlalchemy import Column, String, Text, DateTime, Integer, Float, BigInteger
from sqlalchemy.sql import func
from app.database import Base

class MarketCache(Base):
    """Simple key-value cache in SQLite for saving API response JSONs."""
    __tablename__ = "market_cache"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MarketQuote(Base):
    """Normalized real-time quote for financial assets."""
    __tablename__ = "market_quotes"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=True)
    exchange = Column(String(100), nullable=True)
    market = Column(String(100), nullable=True)  # e.g., "India", "USA", "Global"
    asset_type = Column(String(50), nullable=True)  # "equity", "index", "forex", "commodity"
    price = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    volume = Column(BigInteger, nullable=True)
    market_cap = Column(Float, nullable=True)
    currency = Column(String(20), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

