"""Daily NSE cash-market breadth and stock-mover data from NSE UDiFF bhavcopies."""

from __future__ import annotations

import csv
import io
import zipfile
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

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
