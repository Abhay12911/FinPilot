"""
FinPilot chat service — powered by Groq LLM.

Builds a system prompt that includes:
  - The FinPilot assistant persona
  - The user's current portfolio holdings (if available)
  - The user's saved research reports titles (if available)

Then sends the full conversation history to Groq and returns the response.
Falls back to a simple keyword-matcher when GROQ_API_KEY is not configured.
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

from app.database import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq client (lazy-loaded so the app boots even if groq isn't installed yet)
# ---------------------------------------------------------------------------
_groq_client = None

def _get_client():
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    if not settings.GROQ_API_KEY:
        return None
    try:
        from groq import Groq
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        return _groq_client
    except ImportError:
        logger.warning("groq package not installed — run `pip install groq`")
        return None
    except Exception as e:
        logger.error(f"Failed to init Groq client: {e}")
        return None


# ---------------------------------------------------------------------------
# System prompt builder
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_BASE = """\
You are FinPilot AI, a premium financial research assistant embedded inside the FinPilot platform.

Your capabilities:
- Analyze company financials, earnings reports, and SEC filings
- Compare businesses across revenue, margins, valuation, and growth
- Explain market trends, macroeconomic factors, and sector dynamics
- Identify portfolio risks, concentration, and opportunities
- Summarize research reports and news

Guidelines:
- Be concise, precise, and professional — this is a finance tool, not a chatbot
- Use **bold** for key numbers, company names, and conclusions
- Format comparisons as markdown tables where helpful
- Always caveat that users should verify before making investment decisions
- If asked about something outside finance/investing, politely redirect to financial topics
- Never fabricate specific numbers you don't know — say "I don't have real-time data on that"
"""

def _build_system_prompt(
    holdings: Optional[List[Dict]] = None,
    reports: Optional[List[Dict]] = None,
) -> str:
    prompt = SYSTEM_PROMPT_BASE

    if holdings:
        lines = ["Current portfolio holdings:"]
        for h in holdings:
            lines.append(
                f"  - {h['ticker']} ({h.get('name', '')}): "
                f"{h['shares']} shares @ avg cost ${h['avgCost']:.2f}, "
                f"current ${h['currentPrice']:.2f}, "
                f"P&L ${h['pnl']:.2f} ({h['pnlPercent']:.1f}%)"
            )
        prompt += "\n\n" + "\n".join(lines)

    if reports:
        lines = ["User's saved research reports:"]
        for r in reports:
            lines.append(f"  - [{r['ticker']}] {r['title']}")
        prompt += "\n\n" + "\n".join(lines)

    return prompt


# ---------------------------------------------------------------------------
# Main chat function
# ---------------------------------------------------------------------------

def chat(
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
    holdings: Optional[List[Dict]] = None,
    reports: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Call Groq with the user's message and return { content, citations }.
    Falls back to the keyword matcher if the key is missing / groq unavailable.
    """
    client = _get_client()
    if client is None:
        return _keyword_fallback(message)

    system_prompt = _build_system_prompt(holdings, reports)

    # Build messages list: system + prior history + new user message
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for turn in history:
            if turn.get("role") in ("user", "assistant") and turn.get("content"):
                messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    # Try primary model, falling back to secondary models if needed
    models_to_try = ["qwen/qwen3.6-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile"]
    
    last_error = None
    for model_name in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.4,
                max_tokens=1024,
            )
            content = completion.choices[0].message.content or ""
            return {"content": content, "citations": []}
        except Exception as e:
            last_error = e
            logger.warning(f"Groq model {model_name} failed: {e}. Trying next fallback...")
            continue

    logger.error(f"All Groq models failed: {last_error}")
    return {
        "content": f"I'm having trouble reaching the AI service right now. Please try again in a moment.\n\n*(Error: {last_error})*",
        "citations": [],
    }


# ---------------------------------------------------------------------------
# Keyword fallback (used when GROQ_API_KEY is not set)
# ---------------------------------------------------------------------------

def _keyword_fallback(message: str) -> Dict[str, Any]:
    msg = message.lower()
    if "nvda" in msg or "nvidia" in msg:
        return {
            "content": (
                "NVIDIA's latest results show exceptional revenue growth driven by the "
                "Data Center segment and massive Blackwell GPU demand. Profit margins remain "
                "at record highs above 75%, though foundry capacity limits are the key bottleneck."
            ),
            "citations": [
                {"title": "NVDA Q4 Earnings Release", "type": "SEC Filing"},
                {"title": "Blackwell Yield Assessment", "type": "Market Data"},
            ],
        }
    if "aapl" in msg or "apple" in msg:
        return {
            "content": (
                "Apple is benefiting from record Services revenue and high gross margins. "
                "However, flat iPhone sales volume and antitrust headwinds remain active risks."
            ),
            "citations": [{"title": "Apple Q3 10-Q Filing", "type": "SEC Filing"}],
        }
    if "portfolio" in msg or "holdings" in msg:
        return {
            "content": (
                "Your portfolio shows current market value based on live prices. "
                "Check the Portfolio page for real-time totals and P&L."
            ),
            "citations": [{"title": "Personal Portfolio Summary", "type": "Database"}],
        }
    return {
        "content": (
            "I'm FinPilot AI, your premium financial research assistant. "
            "Ask me about company financials, market trends, or your portfolio. "
            "\n\n*(Tip: set GROQ_API_KEY in the backend .env file to enable the full AI experience.)*"
        ),
        "citations": [],
    }
