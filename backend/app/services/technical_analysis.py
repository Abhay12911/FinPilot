"""Deterministic technical indicators calculated from stored OHLCV bars."""

from __future__ import annotations

from math import sqrt
from typing import Any

from app.services.stock_service import StockService


def _sma(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def _ema(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    result = sum(values[:period]) / period
    multiplier = 2 / (period + 1)
    for value in values[period:]:
        result = (value - result) * multiplier + result
    return result


def _rsi(values: list[float], period: int) -> float | None:
    if len(values) <= period:
        return None
    changes = [values[index] - values[index - 1] for index in range(1, len(values))]
    gains = [max(change, 0.0) for change in changes]
    losses = [max(-change, 0.0) for change in changes]
    average_gain = sum(gains[:period]) / period
    average_loss = sum(losses[:period]) / period
    for gain, loss in zip(gains[period:], losses[period:]):
        average_gain = ((average_gain * (period - 1)) + gain) / period
        average_loss = ((average_loss * (period - 1)) + loss) / period
    if average_loss == 0:
        return 100.0
    return 100 - (100 / (1 + (average_gain / average_loss)))


def _atr(bars: list[dict[str, Any]], period: int) -> float | None:
    if len(bars) <= period:
        return None
    true_ranges = []
    for index, bar in enumerate(bars):
        previous_close = bars[index - 1]["close"] if index else bar["close"]
        true_ranges.append(max(
            bar["high"] - bar["low"],
            abs(bar["high"] - previous_close),
            abs(bar["low"] - previous_close),
        ))
    return sum(true_ranges[-period:]) / period


def calculate_indicators(bars: list[dict[str, Any]], period: int = 14) -> dict[str, Any]:
    if period < 2:
        raise ValueError("period must be at least 2")
    closes = [float(bar["close"]) for bar in bars]
    if not closes:
        raise ValueError("No historical data")
    fast_period = max(2, min(12, period))
    slow_period = max(fast_period + 1, min(26, period * 2))
    fast_ema = _ema(closes, fast_period)
    slow_ema = _ema(closes, slow_period)
    macd = fast_ema - slow_ema if fast_ema is not None and slow_ema is not None else None
    recent_volumes = [float(bar["volume"]) for bar in bars[-period:]]
    average_volume = sum(recent_volumes) / len(recent_volumes)
    latest = bars[-1]
    return {
        "timestamp": latest["timestamp"],
        "close": closes[-1],
        "sma": _sma(closes, period),
        "ema": _ema(closes, period),
        "rsi": _rsi(closes, period),
        "macd": macd,
        "atr": _atr(bars, period),
        "bollinger_middle": _sma(closes, period),
        "bollinger_upper": (_sma(closes, period) + 2 * sqrt(sum((value - _sma(closes, period)) ** 2 for value in closes[-period:]) / period)) if _sma(closes, period) is not None and len(closes) >= period else None,
        "bollinger_lower": (_sma(closes, period) - 2 * sqrt(sum((value - _sma(closes, period)) ** 2 for value in closes[-period:]) / period)) if _sma(closes, period) is not None and len(closes) >= period else None,
        "volume_ratio": (float(latest["volume"]) / average_volume) if average_volume else 0.0,
    }


def get_stock_indicators(db, symbol: str, period: int = 14, limit: int = 252) -> dict[str, Any]:
    history = StockService(db).get_history(symbol, min(max(limit, period + 1), 252))
    if len(history) < period + 1:
        raise ValueError(f"Not enough historical data for indicators; need {period + 1} bars")
    stock = StockService(db).find_stock(symbol)
    return {
        "ticker": stock.ticker if stock else symbol.strip().upper(),
        "symbol": stock.symbol if stock else symbol.strip().upper(),
        "period": period,
        "indicators": calculate_indicators(history, period),
    }