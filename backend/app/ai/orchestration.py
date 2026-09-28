"""Query routing and evidence assembly for the FinPilot AI service."""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy.orm import Session

from app.ai.providers import configured_provider
from app.ai.tools import (
    get_52_week_data,
    get_stock_history,
    get_stock_move_attribution,
    get_stock_quote,
    get_technical_indicators,
)
from app.models.research import Document, DocumentChunk
from app.models.stock import PriceBar, Stock
from app.provider.yahoo_finance import fetch_history, search_symbols
from app.services.rag import retrieve_documents as hybrid_retrieve_documents


def _json_default(value: Any):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    raise TypeError(f"Cannot serialize {type(value).__name__}")


def route_query(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ("document", "filing", "report", "management", "transcript")):
        return "documents"
    if any(word in text for word in ("why", "move", "fell", "rose", "dropped", "jumped")):
        return "attribution"
    if any(word in text for word in ("rsi", "macd", "overbought", "oversold", "technical")):
        return "technical_analysis"
    if any(word in text for word in ("52-week", "52 week", "high", "low")):
        return "market_data"
    return "market_data"


def _local_symbol_from_message(db: Session, message: str, current_symbol: str | None) -> str | None:
    if current_symbol:
        candidate = current_symbol.strip()
        if re.fullmatch(r"[A-Za-z0-9._-]+", candidate):
            matching_stock = db.query(Stock).filter(
                (Stock.ticker == candidate.upper()) | (Stock.symbol == candidate.upper())
            ).one_or_none()
            if matching_stock:
                return matching_stock.ticker
        matching_stock = db.query(Stock).filter(Stock.company_name.ilike(candidate)).one_or_none()
        if matching_stock:
            return matching_stock.ticker
    lowered = message.lower()
    for stock in db.query(Stock).all():
        if stock.ticker.lower() in lowered or stock.company_name.lower() in lowered:
            return stock.ticker
    match = re.search(r"\b[A-Z][A-Z0-9]{1,14}\b", message)
    if match:
        candidate = match.group(0)
        matching_stock = db.query(Stock).filter(Stock.ticker == candidate).one_or_none()
        if matching_stock:
            return matching_stock.ticker
    return None


async def _resolve_stock(db: Session, message: str, current_symbol: str | None) -> str | None:
    local_symbol = _local_symbol_from_message(db, message, current_symbol)
    if local_symbol:
        return local_symbol

    search_queries = [current_symbol or message]
    lowered_message = message.lower()
    for marker in (" for ", " about ", " on ", " of "):
        if marker in lowered_message:
            marker_index = lowered_message.rfind(marker)
            search_queries.append(message[marker_index + len(marker):].strip())
    words = re.findall(r"[A-Za-z][A-Za-z.&'-]{2,}", message)
    search_queries.extend(word[:3] for word in reversed(words) if len(word) >= 4)
    search_queries.extend(reversed(words))
    matches: list[dict] = []
    matched_queries: list[str] = []
    for query in search_queries:
        if query:
            matches = await search_symbols(query)
            if matches:
                matched_queries.append(query)
                break
    if not matches:
        return None
    def score(item: dict) -> float:
        name = re.sub(r"[^a-z0-9]", "", str(item.get("longname") or item.get("shortname") or "").lower())
        symbol = re.sub(r"[^a-z0-9]", "", str(item.get("symbol", "")).lower())
        queries = [re.sub(r"[^a-z0-9]", "", query.lower()) for query in search_queries + matched_queries]
        return max(
            max(SequenceMatcher(None, query, name).ratio(), SequenceMatcher(None, query, symbol).ratio())
            for query in queries if query
        )

    match = max(matches, key=score)
    yahoo_symbol = str(match["symbol"]).upper()
    ticker = yahoo_symbol.rsplit(".", 1)[0]
    stock = db.query(Stock).filter(Stock.symbol == yahoo_symbol).one_or_none()
    if stock is None:
        stock = Stock(
            ticker=ticker,
            symbol=yahoo_symbol,
            company_name=match.get("longname") or match.get("shortname") or ticker,
            exchange="NSE" if yahoo_symbol.endswith(".NS") else "BSE",
        )
        db.add(stock)
        db.flush()

    if db.query(PriceBar).filter(PriceBar.stock_id == stock.id).count() < 2:
        history = await fetch_history(yahoo_symbol, "1day", 252)
        for row in history:
            try:
                timestamp = datetime.strptime(row["datetime"], "%Y-%m-%d %H:%M:%S")
                exists = db.query(PriceBar).filter(
                    PriceBar.stock_id == stock.id, PriceBar.timestamp == timestamp
                ).one_or_none()
                if exists is None:
                    db.add(PriceBar(
                        stock_id=stock.id,
                        timestamp=timestamp,
                        open=float(row["open"]),
                        high=float(row["high"]),
                        low=float(row["low"]),
                        close=float(row["close"]),
                        volume=int(float(row["volume"] or 0)),
                    ))
            except (KeyError, TypeError, ValueError):
                continue
        db.commit()
    return ticker


def retrieve_documents(db: Session, query: str, user_id: int | None = None, limit: int = 5) -> list[dict]:
    statement = db.query(DocumentChunk, Document).join(Document, Document.id == DocumentChunk.document_id)
    if user_id is not None:
        statement = statement.filter(Document.user_id == user_id)
    matches = statement.filter(DocumentChunk.text.ilike(f"%{query.strip()}%")).limit(limit).all()
    return [
        {
            "document_id": document.id,
            "document": document.name,
            "chunk": chunk.chunk_index,
            "text": chunk.text,
        }
        for chunk, document in matches
    ]


async def build_evidence(db: Session, message: str, current_symbol: str | None = None, user_id: int | None = None) -> dict:
    route = route_query(message)
    symbol = await _resolve_stock(db, message, current_symbol)
    evidence: dict[str, Any] = {"route": route, "symbol": symbol, "facts": [], "citations": []}
    if route == "documents":
        matches = await hybrid_retrieve_documents(db, message, user_id)
        evidence["facts"] = matches
        evidence["citations"] = [{"type": "document", "document_id": item["document_id"], "title": item["document"]} for item in matches]
        return evidence
    if not symbol:
        evidence["facts"].append({"message": "No stock symbol was detected; provide a ticker or current_symbol."})
        return evidence
    if route == "attribution":
        result = get_stock_move_attribution(db, symbol)
    elif route == "technical_analysis":
        result = get_technical_indicators(db, symbol)
    elif "52" in message.lower() or "high" in message.lower() or "low" in message.lower():
        result = get_52_week_data(db, symbol)
    elif "history" in message.lower() or "return" in message.lower():
        result = {"symbol": symbol, "history": get_stock_history(db, symbol, 20)}
    else:
        result = get_stock_quote(db, symbol)
    evidence["facts"].append(result)
    if route == "market_data" and "price" in result:
        try:
            evidence["facts"].append(get_52_week_data(db, symbol))
        except ValueError:
            pass
    evidence["citations"].append({"type": "market_database", "symbol": symbol})
    return evidence


def deterministic_answer(message: str, evidence: dict) -> str:
    facts = evidence["facts"]
    if not facts:
        return "I need a stock symbol or an indexed document query to answer that."
    if evidence["route"] == "documents":
        if not facts:
            return "I could not find matching indexed document evidence."
        return "I found indexed document evidence, but an LLM is required to synthesize a detailed answer."
    fact = facts[0]
    if evidence["route"] == "attribution":
        move = fact["move"]
        measured = {item["type"]: item for item in fact.get("evidence", [])}
        news = [item for item in fact.get("evidence", []) if item.get("type") == "news"]
        lines = [
            f"{fact['ticker']} ({fact['symbol']}) movement analysis",
            f"Current close: {move['close']:.2f}",
            f"Return over {fact['window_days']} session(s): {move['return_percent']:.2f}%",
        ]
        if "volume" in measured:
            lines.append(f"Volume versus 20-session average: {measured['volume']['value']:.2f}x")
        if "volatility" in measured:
            lines.append(f"Recent daily volatility: {measured['volatility']['value']:.2f}%")
        if news:
            lines.append("Recent related news: " + "; ".join(item["title"] for item in news[:3]))
        else:
            lines.append("Recent related news: no cached articles were found.")
        lines.append("These are measured or correlated signals; they do not prove why the price moved.")
        return "\n".join(lines)
    if "price" in fact:
        lines = [
            f"{fact['company_name']} ({fact['symbol']})",
            f"Current price: {fact['price']:.2f}",
            f"Change: {fact['change']:.2f} ({fact['change_percent']:.2f}%)",
            f"Volume: {fact['volume']:,}",
        ]
        range_fact = next((item for item in facts[1:] if "week_52_high" in item), None)
        if range_fact:
            lines.extend([
                f"52-week range: {range_fact['week_52_low']:.2f} - {range_fact['week_52_high']:.2f}",
                f"Distance from 52-week high: {range_fact['distance_from_high_pct']:.2f}%",
                f"Distance from 52-week low: {range_fact['distance_from_low_pct']:.2f}%",
            ])
        lines.append("These figures come from the stored market data feed.")
        return "\n".join(lines)
    if "week_52_high" in fact:
        return f"{fact['symbol']} has a calculated 52-week high of {fact['week_52_high']:.2f} and low of {fact['week_52_low']:.2f}."
    return json.dumps(fact, default=_json_default)


async def answer_query(db: Session, message: str, current_symbol: str | None = None, user_id: int | None = None) -> dict:
    evidence = await build_evidence(db, message, current_symbol, user_id)
    provider = configured_provider()
    context = json.dumps(evidence, default=_json_default)
    if provider and evidence["facts"] and evidence.get("symbol"):
        # Use the Responses API tool loop for configured LLMs. The model can
        # request additional deterministic tools instead of answering from memory.
        from app.ai.agent import ask_finpilot

        try:
            answer = await ask_finpilot(
                db,
                message,
                evidence.get("symbol") or current_symbol,
                user_id=user_id,
                evidence_context=context,
            )
            provider_name = provider.name
        except Exception:
            answer = deterministic_answer(message, evidence)
            provider_name = "deterministic"
    else:
        answer = deterministic_answer(message, evidence)
        provider_name = "deterministic"
    return {"answer": answer, "route": evidence["route"], "evidence": evidence["facts"], "citations": evidence["citations"], "provider": provider_name}