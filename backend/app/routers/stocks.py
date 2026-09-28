from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.stock_service import InsufficientHistoryError, StockNotFoundError, StockService
from app.services.technical_analysis import get_stock_indicators
from app.services.price_attribution import get_price_move_attribution


router = APIRouter(prefix="/api/v1/stocks", tags=["Stocks"])


@router.get("/search")
def search_stocks(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return StockService(db).search(q)


@router.get("/{symbol}/quote")
def get_stock_quote(symbol: str, db: Session = Depends(get_db)):
    try:
        return StockService(db).get_quote(symbol)
    except (StockNotFoundError, InsufficientHistoryError) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{symbol}/history")
def get_stock_history(
    symbol: str,
    limit: int = Query(252, ge=1, le=252),
    db: Session = Depends(get_db),
):
    try:
        return StockService(db).get_history(symbol, limit)
    except StockNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{symbol}/indicators")
def get_indicators(
    symbol: str,
    period: int = Query(14, ge=2, le=100),
    limit: int = Query(252, ge=20, le=252),
    db: Session = Depends(get_db),
):
    try:
        return get_stock_indicators(db, symbol, period, limit)
    except (StockNotFoundError, ValueError) as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{symbol}/attribution")
def get_attribution(
    symbol: str,
    window_days: int = Query(1, ge=1, le=20),
    db: Session = Depends(get_db),
):
    try:
        return get_price_move_attribution(db, symbol, window_days)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
