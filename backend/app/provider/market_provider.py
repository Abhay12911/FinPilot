"""Replaceable market-data provider interface used by ingestion jobs."""

from abc import ABC, abstractmethod
from typing import Any

from app.provider.yahoo_finance import fetch_history


class MarketDataProvider(ABC):
    @abstractmethod
    async def get_history(self, symbol: str, period: str = "1y", interval: str = "1d") -> list[dict[str, Any]]:
        raise NotImplementedError


class YahooFinanceProvider(MarketDataProvider):
    """Adapter around the project's existing async Yahoo Finance client."""

    async def get_history(self, symbol: str, period: str = "1y", interval: str = "1d") -> list[dict[str, Any]]:
        interval_map = {"1d": "1day", "1wk": "1week"}
        return await fetch_history(symbol, interval_map.get(interval, interval), 252 if period == "1y" else 100)
