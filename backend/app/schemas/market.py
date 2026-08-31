from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MarketStatusExchange(BaseModel):
    status: str  # "open", "closed", "pre_market", "after_hours", "unknown"
    exchange: str
    last_updated: Optional[str] = None

class MarketStatusResponse(BaseModel):
    india: MarketStatusExchange
    usa: MarketStatusExchange

class MarketIndexResponse(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    currency: str
    market: str
    timestamp: Optional[datetime] = None

class MarketIndicesResponse(BaseModel):
    india: List[MarketIndexResponse]
    usa: List[MarketIndexResponse]
    global_markets: List[MarketIndexResponse]  # maps to "global" on frontend

class MarketMoverItem(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    exchange: Optional[str] = None

class MarketMoversResponse(BaseModel):
    gainers: List[MarketMoverItem]
    losers: List[MarketMoverItem]
    active: List[MarketMoverItem]

class SectorPerformanceResponse(BaseModel):
    sector: str
    change_percent: float
    market: str
    timestamp: Optional[datetime] = None

class HistoricalPoint(BaseModel):
    timestamp: str  # ISO-format string e.g. "2026-08-15T16:00:00"
    open: float
    high: float
    low: float
    close: float
    volume: int

    class Config:
        # Allow datetime objects to be returned too (Pydantic will coerce)
        json_encoders = {
            __import__('datetime').datetime: lambda v: v.isoformat()
        }


class MarketSearchItem(BaseModel):
    symbol: str
    name: str
    exchange: str
    type: str  # "equity", "index", "forex", "commodity"

class MarketSearchResponse(BaseModel):
    equities: List[MarketSearchItem]
    indices: List[MarketSearchItem]
    forex: List[MarketSearchItem]
    commodities: List[MarketSearchItem]

class ForexQuote(BaseModel):
    pair: str
    rate: float
    change: float
    change_percent: float

class CommodityQuote(BaseModel):
    name: str
    price: float
    change: float
    change_percent: float

class MarketQuoteOut(BaseModel):
    id: Optional[int] = None
    symbol: str
    name: Optional[str] = None
    exchange: Optional[str] = None
    market: Optional[str] = None
    asset_type: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    previous_close: Optional[float] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    currency: Optional[str] = None
    timestamp: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MarketSignalResponse(BaseModel):
    asset: str
    signal: str  # "Bullish", "Bearish", "Neutral", "Unusual Volume", etc.
    strength: int  # 0 to 100
    reason: str
    timestamp: str
