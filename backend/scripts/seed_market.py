"""Load a small NSE universe and one year of Yahoo Finance daily bars.

Run from backend after the database is available:
    python -m scripts.seed_market
"""

import asyncio
from datetime import datetime

from app.database import SessionLocal
from app.models.stock import PriceBar, Stock
from app.provider.market_provider import YahooFinanceProvider

UNIVERSE = [
    {"ticker": "RELIANCE", "symbol": "RELIANCE.NS", "name": "Reliance Industries"},
    {"ticker": "TCS", "symbol": "TCS.NS", "name": "Tata Consultancy Services"},
    {"ticker": "INFY", "symbol": "INFY.NS", "name": "Infosys"},
    {"ticker": "HDFCBANK", "symbol": "HDFCBANK.NS", "name": "HDFC Bank"},
    {"ticker": "ICICIBANK", "symbol": "ICICIBANK.NS", "name": "ICICI Bank"},
    {"ticker": "SBIN", "symbol": "SBIN.NS", "name": "State Bank of India"},
    {"ticker": "ITC", "symbol": "ITC.NS", "name": "ITC"},
    {"ticker": "LT", "symbol": "LT.NS", "name": "Larsen & Toubro"},
    {"ticker": "BHARTIARTL", "symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
    {"ticker": "AXISBANK", "symbol": "AXISBANK.NS", "name": "Axis Bank"},
]


async def seed() -> None:
    db = SessionLocal()
    provider = YahooFinanceProvider()
    try:
        for item in UNIVERSE:
            stock = db.query(Stock).filter(Stock.ticker == item["ticker"]).one_or_none()
            if stock is None:
                stock = Stock(ticker=item["ticker"], symbol=item["symbol"], company_name=item["name"], exchange="NSE")
                db.add(stock)
                db.flush()

            history = await provider.get_history(stock.symbol, period="1y", interval="1d")
            if not history:
                print(f"No market data returned for {stock.symbol}; keeping its existing bars.")
                continue

            db.query(PriceBar).filter(PriceBar.stock_id == stock.id).delete()
            bars = []
            for row in history:
                try:
                    bars.append(PriceBar(
                        stock_id=stock.id,
                        timestamp=datetime.strptime(row["datetime"], "%Y-%m-%d %H:%M:%S"),
                        open=float(row["open"]), high=float(row["high"]), low=float(row["low"]),
                        close=float(row["close"]), volume=int(float(row["volume"] or 0)),
                    ))
                except (KeyError, TypeError, ValueError):
                    continue
            db.add_all(bars)
            print(f"Loaded {len(bars)} daily bars for {stock.ticker}.")
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(seed())
