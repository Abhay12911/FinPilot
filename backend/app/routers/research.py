from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.research import Report
from typing import List, Dict, Any

router = APIRouter(
    prefix="/research",
    tags=["research"]
)

# Seeding helper for default reports
def ensure_default_reports(user_id: int, db: Session):
    count = db.query(Report).filter(Report.user_id == user_id).count()
    if count == 0:
        default_reports = [
            Report(
                user_id=user_id,
                ticker="AAPL",
                title="Apple Inc. (AAPL) Q3 Valuation & Risks Report",
                summary="A detailed evaluation of Apple's pricing power, Services segment margins, and geopolitical risk factors.",
                status="completed",
                content="## Apple Inc. (AAPL) Q3 Report\n\n### Core Summary\nApple exhibits strong consumer loyalty and high retention. Service margins at 74% are the core growth engine, offsetting flat iPhone units.\n\n### Recommendation\nBuy with target price $255."
            ),
            Report(
                user_id=user_id,
                ticker="NVDA",
                title="NVIDIA Corporation (NVDA) Blackwell Architecture Outlook",
                summary="Analysis of next-generation GPU demand, foundry yield rates, and hyperscaler CapEx projections.",
                status="completed",
                content="## NVIDIA Corporation (NVDA) Blackwell Outlook\n\n### Core Summary\nHyperscaler demand remains robust. Blackwell B200 shows massive training efficiency improvement. Supply constraints remain a key hurdle.\n\n### Recommendation\nStrong Buy."
            )
        ]
        for r in default_reports:
            db.add(r)
        db.commit()

@router.get("/reports")
def get_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ensure_default_reports(user_id, db)
    reports = db.query(Report).filter(Report.user_id == user_id).all()
    
    result = []
    for r in reports:
        result.append({
            "id": r.id,
            "ticker": r.ticker,
            "title": r.title,
            "summary": r.summary,
            "status": r.status,
            "createdAt": r.created_at.strftime("%Y-%m-%d %H:%M"),
            "content": r.content
        })
    return result

@router.post("/reports")
def generate_report(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ticker = data.get("ticker", "AAPL").upper()
    title = f"{ticker} Deep Research Report"
    summary = f"Comprehensive AI-generated research on {ticker} financials and market sentiments."
    
    new_report = Report(
        user_id=user_id,
        ticker=ticker,
        title=title,
        summary=summary,
        status="completed",
        content=f"## {ticker} Research Report\n\n### Executive Summary\nAnalysis of {ticker} performance shows favorable technicals and strong fundamental growth.\n\n### Key Metrics\nPE Ratio is in line with historical industry median. Return on Equity remains robust."
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "id": new_report.id,
        "ticker": new_report.ticker,
        "title": new_report.title,
        "summary": new_report.summary,
        "status": new_report.status,
        "createdAt": new_report.created_at.strftime("%Y-%m-%d %H:%M"),
        "content": new_report.content
    }

@router.post("/chat")
def chat_response(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    message = data.get("message", "")
    # Simple simulated intelligent chatbot response based on ticker detection
    response = "I'm FinPilot AI, your premium workspace. I can help analyze your portfolio, watchlist, and research reports."
    citations = []
    
    msg_lower = message.lower()
    if "nvda" in msg_lower or "nvidia" in msg_lower:
        response = (
            "NVIDIA's latest results show exceptional revenue growth driven by the "
            "Data Center segment and massive Blackwell GPU demand. Profit margins remain "
            "at record highs above 75%, though foundry capacity limits are the key bottleneck."
        )
        citations = [
            {"title": "NVDA Q4 Earnings Release", "type": "SEC Filing"},
            {"title": "Blackwell Yield Assessment", "type": "Market Data"}
        ]
    elif "aapl" in msg_lower or "apple" in msg_lower:
        response = (
            "Apple is benefiting from record Services revenue and high gross margins. "
            "However, flat iPhone sales volume and domestic regulator headwinds (antitrust) "
            "remain active risks."
        )
        citations = [
            {"title": "Apple Q3 10-Q Filing", "type": "SEC Filing"}
        ]
    elif "portfolio" in msg_lower or "holdings" in msg_lower:
        response = (
            "Your portfolio value is currently $128,450, showing an annual gain of 8.42%. "
            "Your largest exposures are in technology (AAPL, NVDA), representing moderate to "
            "high concentration risk."
        )
        citations = [
            {"title": "Personal Portfolio Summary", "type": "Database"}
        ]

    return {
        "content": response,
        "citations": citations
    }
