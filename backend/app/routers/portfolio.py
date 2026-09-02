import asyncio
import datetime
import logging
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.portfolio import Holding, WatchlistItem
from app.models.research import Report, Document
from app.services import market_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def ensure_default_portfolio(user_id: int, db: Session):
    holdings_count = db.query(Holding).filter(Holding.user_id == user_id).count()
    if holdings_count == 0:
        default_holdings = [
            Holding(user_id=user_id, ticker="AAPL", name="Apple Inc.", shares=10.0, avg_cost=150.0, current_price=231.40),
            Holding(user_id=user_id, ticker="NVDA", name="NVIDIA Corporation", shares=50.0, avg_cost=80.0, current_price=182.45),
            Holding(user_id=user_id, ticker="MSFT", name="Microsoft Corporation", shares=5.0, avg_cost=380.0, current_price=511.20),
            Holding(user_id=user_id, ticker="AMZN", name="Amazon.com, Inc.", shares=15.0, avg_cost=160.0, current_price=228.31),
        ]
        for h in default_holdings:
            db.add(h)
        db.commit()

    watchlist_count = db.query(WatchlistItem).filter(WatchlistItem.user_id == user_id).count()
    if watchlist_count == 0:
        default_watchlist = [
            WatchlistItem(user_id=user_id, ticker="AAPL", name="Apple Inc."),
            WatchlistItem(user_id=user_id, ticker="NVDA", name="NVIDIA Corporation"),
            WatchlistItem(user_id=user_id, ticker="MSFT", name="Microsoft Corporation"),
            WatchlistItem(user_id=user_id, ticker="AMZN", name="Amazon.com, Inc."),
        ]
        for w in default_watchlist:
            db.add(w)
        db.commit()


async def _fetch_quotes_concurrently(db: Session, tickers: List[str]) -> Dict[str, Any]:
    async def _fetch_one(ticker: str):
        try:
            q = await market_service.get_quote(db, ticker)
            return ticker, q
        except Exception:
            return ticker, None

    results = await asyncio.gather(*[_fetch_one(t) for t in tickers], return_exceptions=False)
    return {ticker: q for ticker, q in results}


@router.get("/summary")
async def get_portfolio_summary(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ensure_default_portfolio(user_id, db)

    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    tickers = list({h.ticker for h in holdings})
    quotes = await _fetch_quotes_concurrently(db, tickers)

    total_val = 0.0
    total_cost = 0.0
    todays_change = 0.0

    for h in holdings:
        q = quotes.get(h.ticker)
        price = q.price if (q and q.price) else h.current_price
        change_per_share = q.change if (q and q.change) else 0.0

        if q and q.price and q.price != h.current_price:
            h.current_price = price
            db.add(h)

        total_val += h.shares * price
        total_cost += h.shares * h.avg_cost
        todays_change += h.shares * change_per_share

    db.commit()

    prev_val = total_val - todays_change
    todays_change_percent = (todays_change / prev_val * 100.0) if prev_val > 0 else 0.0
    ytd_return = ((total_val - total_cost) / total_cost * 100.0) if total_cost > 0 else 8.42

    watchlist_count = db.query(WatchlistItem).filter(WatchlistItem.user_id == user_id).count()
    reports_count = db.query(Report).filter(Report.user_id == user_id).count()

    total_return_abs = total_val - total_cost
    total_return_pct = (total_return_abs / total_cost * 100.0) if total_cost > 0 else 0.0

    return {
        "portfolioValue": round(total_val, 2),
        "todaysChange": round(todays_change, 2),
        "todaysChangePercent": round(todays_change_percent, 2),
        "ytdReturn": round(ytd_return, 2),
        "totalCost": round(total_cost, 2),
        "totalReturn": round(total_return_abs, 2),
        "totalReturnPercent": round(total_return_pct, 2),
        "watchlistActive": watchlist_count,
        "watchlistTotal": watchlist_count,
        "aiReportsThisWeek": reports_count,
        "aiReportsTotal": reports_count,
        "riskScore": "Medium",
        "beta": 1.24,
    }


@router.get("/performance")
async def get_portfolio_performance(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ensure_default_portfolio(user_id, db)
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    if not holdings:
        return []

    async def fetch_history(h):
        try:
            hist = await market_service.get_history(db, h.ticker, "1day", 30)
            return h, hist
        except Exception as e:
            logger.error(f"Error fetching history for {h.ticker}: {e}")
            return h, []

    results = await asyncio.gather(*[fetch_history(h) for h in holdings], return_exceptions=False)

    daily_totals = {}
    now = datetime.datetime.utcnow()

    for h, hist in results:
        price_map = {}
        for pt in hist:
            ts = pt.get("timestamp")
            if isinstance(ts, str):
                try:
                    ts = datetime.datetime.fromisoformat(ts)
                except:
                    pass
            if isinstance(ts, datetime.datetime):
                date_str = ts.strftime("%b %d")
                price_map[date_str] = pt.get("close", h.current_price)

        last_price = h.current_price
        for i in range(30, -1, -1):
            d = now - datetime.timedelta(days=i)
            date_str = d.strftime("%b %d")
            price = price_map.get(date_str, last_price)
            last_price = price
            if date_str not in daily_totals:
                daily_totals[date_str] = 0.0
            daily_totals[date_str] += price * h.shares

    data = []
    for i in range(30, -1, -1):
        d = now - datetime.timedelta(days=i)
        date_str = d.strftime("%b %d")
        if date_str in daily_totals:
            data.append({"date": date_str, "value": round(daily_totals[date_str], 2)})

    return data


@router.get("/holdings")
async def get_portfolio_holdings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ensure_default_portfolio(user_id, db)
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    tickers = list({h.ticker for h in holdings})
    quotes = await _fetch_quotes_concurrently(db, tickers)

    result = []
    for h in holdings:
        q = quotes.get(h.ticker)
        price = q.price if (q and q.price) else h.current_price

        if q and q.price and q.price != h.current_price:
            h.current_price = price
            db.add(h)

        value = h.shares * price
        cost = h.shares * h.avg_cost
        pnl = value - cost
        pnl_percent = (pnl / cost * 100.0) if cost > 0 else 0.0

        raw_change_pct = (q.change_percent if q and q.change_percent else 0.0)
        change_percent_today = round(raw_change_pct * 100.0, 2) if abs(raw_change_pct) < 1.0 else round(raw_change_pct, 2)

        result.append({
            "id": h.id,
            "ticker": h.ticker,
            "name": h.name,
            "shares": h.shares,
            "avgCost": h.avg_cost,
            "currentPrice": round(price, 2),
            "value": round(value, 2),
            "pnl": round(pnl, 2),
            "pnlPercent": round(pnl_percent, 2),
            "changePercentToday": change_percent_today
        })

    db.commit()
    return result


@router.get("/watchlist")
async def get_watchlist(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ensure_default_portfolio(user_id, db)
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == user_id).all()

    tickers = [item.ticker for item in items]
    quotes = await _fetch_quotes_concurrently(db, tickers)

    result = []
    for item in items:
        q = quotes.get(item.ticker)
        price_val = (q.price or 150.0) if q else 150.0
        change_pct = ((q.change_percent * 100.0) if q.change_percent else 0.0) if q else 0.0

        if change_pct > 1.5:
            sig = "Bullish"
        elif change_pct > 0.0:
            sig = "Positive"
        elif change_pct < -1.5:
            sig = "Bearish"
        else:
            sig = "Neutral"

        result.append({
            "ticker": item.ticker,
            "name": item.name,
            "price": round(price_val, 2),
            "changePercent": round(change_pct, 2),
            "signal": sig
        })
    return result


@router.post("/watchlist")
def add_to_watchlist(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ticker = data.get("ticker", "").upper().strip()
    name = data.get("name", ticker)
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == user_id,
        WatchlistItem.ticker == ticker
    ).first()

    if existing:
        return {"message": "Ticker already in watchlist"}

    new_item = WatchlistItem(user_id=user_id, ticker=ticker, name=name)
    db.add(new_item)
    db.commit()
    return {"message": f"{ticker} added to watchlist"}


@router.delete("/watchlist/{ticker}")
def remove_from_watchlist(
    ticker: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == user_id,
        WatchlistItem.ticker == ticker.upper().strip()
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Ticker not found in watchlist")

    db.delete(item)
    db.commit()
    return {"message": f"{ticker} removed from watchlist"}
