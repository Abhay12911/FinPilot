"""Deterministic portfolio analytics calculated from holdings and stored bars."""

from __future__ import annotations

from math import sqrt

from sqlalchemy.orm import Session

from app.models.portfolio import Holding
from app.services.stock_service import StockService


def _stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return sqrt(sum((item - mean) ** 2 for item in values) / (len(values) - 1))


def calculate_portfolio_analytics(db: Session, user_id: int) -> dict:
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    if not holdings:
        return {
            "total_value": 0.0,
            "total_cost": 0.0,
            "pnl": 0.0,
            "pnl_percent": 0.0,
            "annualized_volatility": 0.0,
            "max_drawdown": 0.0,
            "concentration": [],
            "risk_contribution": [],
        }

    service = StockService(db)
    positions = []
    portfolio_returns: list[float] = []
    total_value = 0.0
    total_cost = 0.0
    for holding in holdings:
        value = float(holding.shares * holding.current_price)
        cost = float(holding.shares * holding.avg_cost)
        total_value += value
        total_cost += cost
        history = service.get_history(holding.ticker, 252) if service.find_stock(holding.ticker) else []
        returns = []
        for previous, current in zip(history[-21:-1], history[-20:]):
            if previous["close"]:
                returns.append((current["close"] - previous["close"]) / previous["close"])
        volatility = _stdev(returns)
        positions.append({
            "ticker": holding.ticker,
            "value": round(value, 2),
            "weight": 0.0,
            "pnl": round(value - cost, 2),
            "volatility_20d": round(volatility, 6),
        })

    for position in positions:
        position["weight"] = round(position["value"] / total_value, 6) if total_value else 0.0
        portfolio_returns.append(position["volatility_20d"] * position["weight"])

    cumulative = 1.0
    peak = 1.0
    max_drawdown = 0.0
    for item in portfolio_returns:
        cumulative *= 1 + item
        peak = max(peak, cumulative)
        max_drawdown = min(max_drawdown, cumulative / peak - 1)

    return {
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "pnl": round(total_value - total_cost, 2),
        "pnl_percent": round((total_value - total_cost) / total_cost * 100, 2) if total_cost else 0.0,
        "annualized_volatility": round(_stdev(portfolio_returns) * sqrt(252) * 100, 2),
        "max_drawdown": round(max_drawdown * 100, 2),
        "concentration": sorted(positions, key=lambda item: item["weight"], reverse=True),
        "risk_contribution": sorted(
            [{"ticker": item["ticker"], "contribution": round(item["weight"] * item["volatility_20d"] * 100, 4)} for item in positions],
            key=lambda item: item["contribution"],
            reverse=True,
        ),
    }