"""Chat entry point that delegates all non-document questions to the LangChain agent."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.ai.agent import ask_finpilot
from app.ai.providers import configured_provider
from app.database import settings


def route_query(message: str) -> str:
    # Kept only for the legacy routing evaluation endpoint.
    text = message.lower()
    if any(word in text for word in ("why", "move", "fell", "rose", "dropped", "jumped")):
        return "attribution"
    if any(word in text for word in ("rsi", "macd", "overbought", "oversold", "technical")):
        return "technical_analysis"
    return "market_data"


async def answer_query(
    db: Session,
    message: str,
    current_symbol: str | None = None,
    conversation_history: list[dict[str, str]] | None = None,
) -> dict:
    # All normal questions go to the LangChain agent first. It chooses whether
    # to call one or more tools and receives their responses before it answers.
    answer = await ask_finpilot(db, message, current_symbol, conversation_history=conversation_history)
    provider = configured_provider()
    return {
        "answer": answer,
        "route": "market_data" if current_symbol else "chat",
        "evidence": [],
        "citations": [],
        "provider": provider.name if provider else "",
        "model": settings.LLM_MODEL or settings.OPENAI_MODEL,
    }
