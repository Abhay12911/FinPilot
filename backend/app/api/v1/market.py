"""
Market Overview Router - Mounted at /api/v1/market in main.py.
Provides endpoints for indices, quotes, status, search, sectors, history, movers, forex, commodities, and signals.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.services import market_service
from app.schemas.market import (
    MarketStatusResponse,
    MarketIndicesResponse,
    MarketQuoteOut,
    MarketMoversResponse,
    SectorPerformanceResponse,
    HistoricalPoint,
    MarketSearchResponse,
    ForexQuote,
    CommodityQuote,
    MarketSignalResponse
)

router = APIRouter(prefix="/api/v1/market", tags=["Market Overview"])

@router.get("/status", response_model=MarketStatusResponse)
async def get_market_status(
    force: bool = Query(False, description="Bypass the short-lived cache"),
    db: Session = Depends(get_db)
):
    """Retrieve operational status for Indian and US stock exchanges."""
    return await market_service.get_market_status(db, force=force)

@router.get("/indices", response_model=MarketIndicesResponse)
async def get_indices(
    force: bool = Query(False, description="Bypass the short-lived quote cache"),
    db: Session = Depends(get_db)
):
    """Retrieve major indices for India, US, and Global sections."""
    return await market_service.get_indices(db, force=force)

@router.get("/quote/{symbol}", response_model=MarketQuoteOut)
async def get_quote(
    symbol: str,
    db: Session = Depends(get_db)
):
    """Retrieve real-time quote for a specific ticker/symbol."""
    quote = await market_service.get_quote(db, symbol)
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote for symbol '{symbol}' not found")
    return quote

@router.get("/movers", response_model=MarketMoversResponse)
async def get_movers(
    market: str = Query(..., description="Market to query: 'india' or 'usa'"),
    force: bool = Query(False, description="Bypass the short-lived cache"),
    db: Session = Depends(get_db)
):
    """Retrieve top gainers, top losers, and most active assets for a market."""
    if market.lower() not in ["india", "usa"]:
        raise HTTPException(status_code=400, detail="Market parameter must be 'india' or 'usa'")
    return await market_service.get_movers(db, market, force=force)

@router.get("/sectors", response_model=List[SectorPerformanceResponse])
async def get_sectors(
    market: str = Query(..., description="Market to query: 'india' or 'usa'"),
    force: bool = Query(False, description="Bypass the short-lived cache"),
    db: Session = Depends(get_db)
):
    """Retrieve sector performance data for a market."""
    if market.lower() not in ["india", "usa"]:
        raise HTTPException(status_code=400, detail="Market parameter must be 'india' or 'usa'")
    return await market_service.get_sectors(db, market, force=force)

@router.get("/history/{symbol}", response_model=List[HistoricalPoint])
async def get_history(
    symbol: str,
    interval: str = Query("1day", description="Supported intervals: 1min, 5min, 15min, 30min, 1h, 1day, 1week"),
    outputsize: int = Query(100, ge=1, le=500, description="Number of historical data points to retrieve"),
    db: Session = Depends(get_db)
):
    """Retrieve historical daily/intraday OHLCV details for a symbol."""
    valid_intervals = ["1min", "5min", "15min", "30min", "1h", "1day", "1week"]
    if interval not in valid_intervals:
        raise HTTPException(
            status_code=400, 
            detail=f"Interval '{interval}' is not supported. Choose from {valid_intervals}"
        )
    return await market_service.get_history(db, symbol, interval, outputsize)

@router.get("/search", response_model=MarketSearchResponse)
async def get_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    db: Session = Depends(get_db)
):
    """Search for matching equities, indices, forex, or commodities."""
    return await market_service.search_market(db, q)

@router.get("/forex", response_model=List[ForexQuote])
async def get_forex(
    db: Session = Depends(get_db)
):
    """Retrieve major global forex exchange rates."""
    return await market_service.get_forex(db)

@router.get("/commodities", response_model=List[CommodityQuote])
async def get_commodities(
    db: Session = Depends(get_db)
):
    """Retrieve major commodities pricing details."""
    return await market_service.get_commodities(db)

@router.get("/signals", response_model=List[MarketSignalResponse])
async def get_signals(
    db: Session = Depends(get_db)
):
    """Retrieve data-driven market signals calculated from live index values."""
    return await market_service.get_market_signals(db)
