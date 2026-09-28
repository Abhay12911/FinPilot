"""Evidence pack for explaining an observed stock move without claiming causality."""

from __future__ import annotations

from datetime import datetime, timedelta
from math import sqrt

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.news import NewsArticle
from app.services.stock_service import StockService


def _standard_deviation(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    average = sum(values) / len(values)
    return sqrt(sum((value - average) ** 2 for value in values) / (len(values) - 1))


def get_price_move_attribution(db: Session, symbol: str, window_days: int = 1) -> dict:
    if window_days < 1 or window_days > 20:
        raise ValueError("window_days must be between 1 and 20")
    service = StockService(db)
    stock = service.find_stock(symbol)
    if stock is None:
        raise ValueError(f"Stock {symbol.upper()} not found")
    bars = service.get_history(symbol, 252)
    if len(bars) <= window_days:
        raise ValueError("Not enough historical data for attribution")

    latest = bars[-1]
    baseline = bars[-window_days - 1]
    return_pct = (latest["close"] - baseline["close"]) / baseline["close"] * 100 if baseline["close"] else 0.0
    previous_bars = bars[-21:-1]
    average_volume = sum(float(bar["volume"]) for bar in previous_bars) / len(previous_bars) if previous_bars else 0.0
    volume_ratio = float(latest["volume"]) / average_volume if average_volume else 0.0
    daily_returns = []
    for previous, current in zip(bars[-21:-1], bars[-20:]):
        if previous["close"]:
            daily_returns.append((current["close"] - previous["close"]) / previous["close"] * 100)
    volatility = _standard_deviation(daily_returns)

    published_after = latest["timestamp"] - timedelta(days=2)
    articles = (
        db.query(NewsArticle)
        .filter(NewsArticle.ticker.ilike(f"%{stock.ticker}%"))
        .filter(NewsArticle.published_at >= published_after)
        .order_by(desc(NewsArticle.published_at))
        .limit(10)
        .all()
    )
    evidence = [
        {
            "type": "price",
            "label": "Observed return",
            "value": round(return_pct, 4),
            "unit": "percent",
            "confidence": "measured",
        },
        {
            "type": "volume",
            "label": "Volume versus previous 20-session average",
            "value": round(volume_ratio, 4),
            "unit": "ratio",
            "confidence": "measured",
        },
        {
            "type": "volatility",
            "label": "Recent daily return volatility",
            "value": round(volatility, 4),
            "unit": "percent standard deviation",
            "confidence": "measured",
        },
    ]
    evidence.extend(
        {
            "type": "news",
            "source_id": article.id,
            "title": article.title,
            "source": article.source,
            "published_at": article.published_at.isoformat() if isinstance(article.published_at, datetime) else article.published_at,
            "sentiment": article.overall_sentiment_label,
            "confidence": "correlation_only",
        }
        for article in articles
    )
    return {
        "ticker": stock.ticker,
        "symbol": stock.symbol,
        "as_of": latest["timestamp"],
        "window_days": window_days,
        "move": {"close": latest["close"], "return_percent": round(return_pct, 4)},
        "evidence": evidence,
        "disclaimer": "Evidence is descriptive and correlational; it does not establish why the price moved.",
    }