"""Small-universe, deterministic market scanner based on stored daily bars."""

from sqlalchemy.orm import Session

from app.models.stock import PriceBar, Stock


class MarketScanner:
    def __init__(self, db: Session):
        self.db = db

    def get_universe_metrics(self) -> list[dict]:
        metrics = []
        for stock in self.db.query(Stock).order_by(Stock.ticker).all():
            bars = self.db.query(PriceBar).filter(PriceBar.stock_id == stock.id).order_by(PriceBar.timestamp).all()
            if len(bars) < 21:
                continue
            latest, previous = bars[-1], bars[-2]
            last_252 = bars[-252:]
            high = max(bar.high for bar in last_252)
            low = min(bar.low for bar in last_252)
            average_volume = sum(bar.volume for bar in bars[-21:-1]) / 20
            change_percent = ((latest.close - previous.close) / previous.close * 100) if previous.close else 0.0
            return_20d = ((latest.close - bars[-21].close) / bars[-21].close * 100) if bars[-21].close else 0.0
            metrics.append({
                "ticker": stock.ticker, "symbol": stock.symbol, "company_name": stock.company_name,
                "price": latest.close, "change_percent": change_percent, "volume": latest.volume,
                "volume_ratio": latest.volume / average_volume if average_volume else 0.0,
                "return_20d": return_20d, "week_52_high": high, "week_52_low": low,
                "distance_from_52w_high": (latest.close - high) / high * 100 if high else 0.0,
                "distance_from_52w_low": (latest.close - low) / low * 100 if low else 0.0,
                "is_52w_high": latest.high >= high, "is_52w_low": latest.low <= low,
            })
        return metrics

    def _rank(self, key: str, reverse: bool, limit: int) -> list[dict]:
        return sorted(self.get_universe_metrics(), key=lambda item: item[key], reverse=reverse)[:limit]

    def top_gainers(self, limit: int = 10) -> list[dict]: return self._rank("change_percent", True, limit)
    def top_losers(self, limit: int = 10) -> list[dict]: return self._rank("change_percent", False, limit)
    def most_volume(self, limit: int = 10) -> list[dict]: return self._rank("volume", True, limit)
    def leaders(self, limit: int = 10) -> list[dict]: return self._rank("return_20d", True, limit)
    def laggards(self, limit: int = 10) -> list[dict]: return self._rank("return_20d", False, limit)
    def near_52_week_high(self, limit: int = 10) -> list[dict]: return self._rank("distance_from_52w_high", True, limit)
    def near_52_week_low(self, limit: int = 10) -> list[dict]: return self._rank("distance_from_52w_low", False, limit)
