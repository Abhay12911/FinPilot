"""Provider-neutral market-depth contract and development implementation."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.services.stock_service import StockService


class MarketDepthProvider(ABC):
    @abstractmethod
    async def snapshot(self, symbol: str) -> dict:
        raise NotImplementedError


class StoredMarketDepthProvider(MarketDepthProvider):
    """Development feed: exposes a normalized empty book until a broker is configured."""

    def __init__(self, db: Session):
        self.db = db

    async def snapshot(self, symbol: str) -> dict:
        quote = StockService(self.db).get_quote(symbol)
        return {
            "symbol": quote["ticker"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "bids": [],
            "asks": [],
            "best_bid": None,
            "best_ask": None,
            "spread": None,
            "status": "provider_not_configured",
            "last_price": quote["price"],
        }