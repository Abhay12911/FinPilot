"""Daily NSE cash-market breadth and stock-mover data from NSE UDiFF bhavcopies."""

from __future__ import annotations

import csv
import io
import time
import zipfile
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

NIFTY_CONSTITUENT_URLS = (
    "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv",
    "https://www.niftyindices.com/IndexConstituent/ind_NiftySmallcap500_list.csv",
    "https://www.niftyindices.com/IndexConstituent/ind_niftymicrocap250_list.csv",
)
_sector_members_cache: dict[str, str] = {}
_sector_members_cached_at = 0.0
_bhavcopy_cache: dict[date, list[dict]] = {}


def _get_sector_members() -> dict[str, str]:
    """Get the latest NSE Indices large/mid/small/micro-cap constituent classification."""
    global _sector_members_cache, _sector_members_cached_at
    if _sector_members_cache and time.monotonic() - _sector_members_cached_at < 24 * 60 * 60:
        return _sector_members_cache

    members: dict[str, str] = {}
    headers = {**NSE_HEADERS, "Referer": "https://www.niftyindices.com/indices/equity/broad-based-indices"}
    with httpx.Client(timeout=15, headers=headers, follow_redirects=True) as client:
        for url in NIFTY_CONSTITUENT_URLS:
            try:
                response = client.get(url)
                response.raise_for_status()
                reader = csv.DictReader(io.StringIO(response.content.decode("utf-8-sig")))
                headers = {str(field or "").strip().lower() for field in (reader.fieldnames or [])}
                if not {"symbol", "industry"}.issubset(headers):
                    continue
                for row in reader:
                    symbol = _get_value(row, "Symbol").upper()
                    sector = _get_value(row, "Industry", "Sector")
                    if symbol and sector:
                        members[symbol] = sector
            except httpx.HTTPError:
                continue
    if members:
        _sector_members_cache = members
        _sector_members_cached_at = time.monotonic()
    else:
        raise RuntimeError("NSE Indices constituent files did not provide sector classifications")
    return members

NSE_BHAVCOPY_URL = (
    "https://nsearchives.nseindia.com/content/cm/"
    "BhavCopy_NSE_CM_0_0_0_{date}_F_0000.csv.zip"
)
NSE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.nseindia.com/",
}


def _get_value(row: dict[str, str], *names: str) -> str:
    normalized = {key.strip().lstrip("\ufeff").lower(): (value or "").strip() for key, value in row.items() if key}
    for name in names:
        value = normalized.get(name.lower())
        if value:
            return value
    return ""


def _rows_for_trading_day(client: httpx.Client, trading_day: date) -> tuple[list[dict], str] | None:
    date_token = trading_day.strftime("%Y%m%d")
    url = NSE_BHAVCOPY_URL.format(date=date_token)
    response = client.get(url)
    if response.status_code == 404:
        return None
    response.raise_for_status()

    try:
        with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
            csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
            with archive.open(csv_name) as file:
                reader = csv.DictReader(io.TextIOWrapper(file, encoding="utf-8-sig", newline=""))
                rows = []
                for row in reader:
                    symbol = _get_value(row, "TckrSymb", "SYMBOL")
                    series = _get_value(row, "SctySrs", "SERIES").upper()
                    close = float(_get_value(row, "ClsPric", "CLOSE") or 0)
                    previous_close = float(_get_value(row, "PrvsClsgPric", "PREV_CLOSE") or 0)
                    if series != "EQ" or not symbol or close <= 0 or previous_close <= 0:
                        continue
                    change = close - previous_close
                    rows.append({
                        "symbol": symbol,
                        "name": _get_value(row, "FinInstrmNm", "NAME") or symbol,
                        "series": series,
                        "close": close,
                        "previous_close": previous_close,
                        "change": change,
                        "change_percent": change / previous_close * 100,
                        "volume": int(float(_get_value(row, "TtlTradgVol", "TOTTRDQTY") or 0)),
                    })
                return rows, url
    except (zipfile.BadZipFile, StopIteration, KeyError, ValueError) as error:
        raise RuntimeError(f"NSE returned an unreadable bhavcopy for {trading_day.isoformat()}") from error


def screen_indian_market(
    direction: str = "gainers",
    limit: int = 5,
    trading_date: str | None = None,
) -> dict:
    """Rank all NSE regular-equity (EQ series) stocks using that date's exchange bhavcopy."""
    direction = direction.strip().lower()
    if direction not in {"gainers", "losers", "movers", "amount"}:
        raise ValueError("direction must be gainers, losers, movers, or amount")
    limit = min(max(int(limit), 1), 20)

    if trading_date:
        try:
            target = date.fromisoformat(trading_date)
        except ValueError as error:
            raise ValueError("trading_date must use YYYY-MM-DD") from error
    else:
        target = datetime.now(ZoneInfo("Asia/Kolkata")).date() - timedelta(days=1)

    last_error: Exception | None = None
    with httpx.Client(timeout=20, headers=NSE_HEADERS, follow_redirects=True) as client:
        for offset in range(8):
            candidate = target - timedelta(days=offset)
            try:
                result = _rows_for_trading_day(client, candidate)
            except httpx.HTTPStatusError as error:
                if error.response.status_code in {403, 404}:
                    last_error = error
                    continue
                raise RuntimeError(f"NSE market-data request failed with HTTP {error.response.status_code}") from error
            except httpx.HTTPError as error:
                last_error = error
                continue
            if result is None:
                continue
            rows, source_url = result
            if not rows:
                continue
            if direction == "gainers":
                ranked = sorted((row for row in rows if row["change_percent"] > 0), key=lambda row: row["change_percent"], reverse=True)
                metric = "highest positive percentage change"
            elif direction == "losers":
                ranked = sorted((row for row in rows if row["change_percent"] < 0), key=lambda row: row["change_percent"])
                metric = "largest negative percentage change"
            elif direction == "movers":
                ranked = sorted(rows, key=lambda row: abs(row["change_percent"]), reverse=True)
                metric = "largest absolute percentage change"
            else:
                ranked = sorted(rows, key=lambda row: abs(row["change"]), reverse=True)
                metric = "largest absolute price change in INR"

            return {
                "market": "NSE India cash equities (EQ series)",
                "trading_date": candidate.isoformat(),
                "ranking_metric": metric,
                "stocks_scanned": len(rows),
                "source": "NSE CM-UDiFF Common Bhavcopy Final",
                "source_url": source_url,
                "results": ranked[:limit],
            }

    if last_error:
        raise RuntimeError(f"Could not retrieve NSE bhavcopy data for {target.isoformat()} or the prior seven calendar days") from last_error
    raise RuntimeError(f"NSE has no bhavcopy data for {target.isoformat()} or the prior seven calendar days")


def fetch_market_breadth_history(start_date: date, end_date: date) -> dict:
    """Fetch NSE EQ-series closes needed to calculate 21-day breadth for a date range."""
    from collections import defaultdict

    # The 50-day sector ranking needs 50 actual market sessions, in addition to
    # the requested breadth window (which itself needs 21 sessions before day one).
    required_dates = max((end_date - start_date).days + 21, 50)
    sessions: dict[date, list[dict]] = {}
    last_error: Exception | None = None
    candidate = end_date
    with httpx.Client(timeout=20, headers=NSE_HEADERS, follow_redirects=True) as client:
        # 21 valid market sessions before the earliest requested date plus the requested window.
        for _ in range(90):
            if candidate.weekday() < 5:
                try:
                    cached_rows = _bhavcopy_cache.get(candidate)
                    result = (cached_rows, "memory-cache") if cached_rows else _rows_for_trading_day(client, candidate)
                    if result:
                        sessions[candidate], _ = result
                        _bhavcopy_cache[candidate] = sessions[candidate]
                        valid_through_start = sum(day <= start_date for day in sessions)
                        if valid_through_start >= 21 and len(sessions) >= required_dates:
                            break
                except httpx.HTTPStatusError as error:
                    if error.response.status_code not in {403, 404}:
                        raise RuntimeError(f"NSE market-data request failed with HTTP {error.response.status_code}") from error
                    last_error = error
                except httpx.HTTPError as error:
                    last_error = error
            candidate -= timedelta(days=1)

    if not sessions:
        raise RuntimeError("NSE daily EQ-series market data is unavailable") from last_error

    symbol_closes: dict[str, list[tuple[date, float]]] = defaultdict(list)
    symbol_volumes: dict[str, list[tuple[date, int]]] = defaultdict(list)
    for session_date, rows in sorted(sessions.items()):
        for row in rows:
            symbol_closes[row["symbol"]].append((session_date, row["close"]))
            symbol_volumes[row["symbol"]].append((session_date, row["volume"]))

    requested_days = []
    for day_offset in range((end_date - start_date).days + 1):
        trading_day = start_date + timedelta(days=day_offset)
        day_rows = {row["symbol"]: row for row in sessions.get(trading_day, [])}
        if not day_rows:
            requested_days.append({"date": trading_day.isoformat(), "is_trading_day": False,
                                   "market_status": "closed" if trading_day.weekday() >= 5 else "unavailable",
                                   "percentage": None, "above": 0, "eligible": 0})
            continue

        above = eligible = 0
        for symbol, row in day_rows.items():
            prior_closes = [close for session_date, close in symbol_closes[symbol] if session_date <= trading_day]
            if len(prior_closes) < 21:
                continue
            eligible += 1
            above += row["close"] > sum(prior_closes[-21:]) / 21
        requested_days.append({"date": trading_day.isoformat(), "is_trading_day": True, "market_status": "available",
                               "percentage": round(above * 100 / eligible, 2) if eligible else None,
                               "above": above, "eligible": eligible})

    latest = max(sessions)
    latest_universe = len(sessions[latest])
    latest_eligible = next((item["eligible"] for item in reversed(requested_days) if item["is_trading_day"]), 0)
    sector_members = _get_sector_members()
    sector_stats: dict[str, dict] = {}
    stock_history: dict[str, list[tuple[date, float, int]]] = {}
    latest_rows = {row["symbol"]: row for row in sessions[latest]}
    for symbol, row in latest_rows.items():
        sector = sector_members.get(symbol)
        if not sector:
            continue
        closes = [close for session_date, close in symbol_closes[symbol] if session_date <= latest]
        volumes = [volume for session_date, volume in symbol_volumes[symbol] if session_date <= latest]
        dated_closes = [(session_date, close) for session_date, close in symbol_closes[symbol] if session_date <= latest]
        dated_volumes = [(session_date, volume) for session_date, volume in symbol_volumes[symbol] if session_date <= latest]
        volume_by_day = dict(dated_volumes)
        stock_history[symbol] = [(day, close, volume_by_day.get(day, 0)) for day, close in dated_closes]
        stat = sector_stats.setdefault(sector, {"sector": sector, "stocks": 0, "eligible_21": 0, "above_21": 0,
                                                  "eligible_50": 0, "above_50": 0, "volume_ratios": [], "volume_spike_stocks": 0})
        stat["stocks"] += 1
        if len(closes) >= 21:
            stat["eligible_21"] += 1
            stat["above_21"] += row["close"] > sum(closes[-21:]) / 21
        if len(closes) >= 50:
            stat["eligible_50"] += 1
            stat["above_50"] += row["close"] > sum(closes[-50:]) / 50
        prior_volumes = [volume for volume in volumes[-11:-1] if volume > 0]
        if prior_volumes:
            ratio = row["volume"] / (sum(prior_volumes) / len(prior_volumes))
            stat["volume_ratios"].append(ratio)
            stat["volume_spike_stocks"] += ratio >= 1.5

    sectors = []
    for stat in sector_stats.values():
        ratios = stat.pop("volume_ratios")
        stat["average_volume_ratio"] = round(sum(ratios) / len(ratios), 2) if ratios else None
        stat["above_21_percent"] = round(stat["above_21"] * 100 / stat["eligible_21"], 2) if stat["eligible_21"] else None
        stat["above_50_percent"] = round(stat["above_50"] * 100 / stat["eligible_50"], 2) if stat["eligible_50"] else None
        sectors.append(stat)
    sectors.sort(key=lambda item: (item["above_50_percent"] or 0, item["above_21_percent"] or 0), reverse=True)
    sectors = sectors[:10]
    for rank, sector in enumerate(sectors, 1):
        sector["rank"] = rank
        sector_symbols = [symbol for symbol, name in sector_members.items() if name == sector["sector"] and symbol in latest_rows]
        ranked_stocks = []
        for symbol in sector_symbols:
            history = stock_history[symbol]
            if len(history) < 11:
                continue
            old_close = history[-11][1]
            current_close = history[-1][1]
            prior_volumes = [item[2] for item in history[-11:-1] if item[2] > 0]
            average_volume = sum(prior_volumes) / len(prior_volumes) if prior_volumes else 0
            current_volume = history[-1][2]
            volume_ratio = current_volume / average_volume if average_volume else None
            ranked_stocks.append({
                "symbol": symbol,
                "name": latest_rows[symbol]["name"],
                "close": current_close,
                "volume": current_volume,
                "volume_spike_ratio": round(volume_ratio, 2) if volume_ratio is not None else None,
                "price_change_10d_percent": round((current_close - old_close) * 100 / old_close, 2) if old_close else None,
            })
        ranked_stocks.sort(key=lambda item: (item["volume_spike_ratio"] or 0, abs(item["price_change_10d_percent"] or 0)), reverse=True)
        sector["top_stocks"] = ranked_stocks[:20]

    return {"market": requested_days, "coverage": {"stocks": latest_universe, "with_history": latest_eligible},
            "source": "NSE EQ-series bhavcopy", "latest_market_date": latest.isoformat(),
            "sectors": sectors, "sector_coverage": {"classified_universe": len(sector_members),
                                                       "stocks_with_data": len(latest_rows.keys() & sector_members.keys())}}
