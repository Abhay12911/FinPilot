"""Persisted NSE stock master data and daily OHLCV bars."""

from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)  # e.g. RELIANCE.NS
    ticker = Column(String(30), unique=True, index=True, nullable=False)  # e.g. RELIANCE
    company_name = Column(String(255), nullable=False)
    exchange = Column(String(20), nullable=False, default="NSE")
    sector = Column(String(100), nullable=True)


class PriceBar(Base):
    __tablename__ = "price_bars"
    __table_args__ = (UniqueConstraint("stock_id", "timestamp", name="uq_stock_timestamp"),)

    id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
