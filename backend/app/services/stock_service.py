"""Deterministic stock and price-bar queries used by HTTP and AI layers."""

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.stock import PriceBar, Stock


def normalize_symbol(symbol: str) -> str:
    value = symbol.strip().upper()
    return value if "." in value else f"{value}.NS"


class StockNotFoundError(ValueError):
    pass


class InsufficientHistoryError(ValueError):
    pass


class StockService:
    def __init__(self, db: Session):
        self.db = db

    def find_stock(self, symbol: str) -> Stock | None:
        return self.db.query(Stock).filter(Stock.symbol == normalize_symbol(symbol)).one_or_none()

    def search(self, query: str, limit: int = 10) -> list[dict]:
        pattern = f"%{query.strip().upper()}%"
        stocks = (
            self.db.query(Stock)
            .filter(or_(Stock.ticker.ilike(pattern), Stock.company_name.ilike(pattern)))
            .order_by(asc(Stock.ticker))
            .limit(limit)
            .all()
        )
        return [{"ticker": s.ticker, "symbol": s.symbol, "company_name": s.company_name, "exchange": s.exchange} for s in stocks]

    def get_quote(self, symbol: str) -> dict:
        stock = self.find_stock(symbol)
        if not stock:
            raise StockNotFoundError(f"Stock {symbol.upper()} not found")
        bars = (
            self.db.query(PriceBar)
            .filter(PriceBar.stock_id == stock.id)
            .order_by(desc(PriceBar.timestamp))
            .limit(2)
            .all()
        )
        if len(bars) < 2:
            raise InsufficientHistoryError(f"Not enough historical data for {stock.ticker}")
        latest, previous = bars
        change = latest.close - previous.close
        return {
            "ticker": stock.ticker, "symbol": stock.symbol, "company_name": stock.company_name,
            "price": latest.close, "change": change,
            "change_percent": (change / previous.close * 100) if previous.close else 0.0,
            "volume": latest.volume, "timestamp": latest.timestamp,
        }

    def get_history(self, symbol: str, limit: int = 252) -> list[dict]:
        stock = self.find_stock(symbol)
        if not stock:
            raise StockNotFoundError(f"Stock {symbol.upper()} not found")
        bars = (
            self.db.query(PriceBar)
            .filter(PriceBar.stock_id == stock.id)
            .order_by(desc(PriceBar.timestamp))
            .limit(limit)
            .all()
        )
        return [
            {"timestamp": bar.timestamp, "open": bar.open, "high": bar.high, "low": bar.low, "close": bar.close, "volume": bar.volume}
            for bar in reversed(bars)
        ]
