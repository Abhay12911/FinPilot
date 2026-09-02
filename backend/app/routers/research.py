from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.research import Report, Document
from app.models.portfolio import Holding
from app.services import chat_service
from app.services import market_service
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/research", tags=["research"])


def _report_to_dict(r: Report) -> dict:
    return {
        "id": r.id,
        "ticker": r.ticker,
        "title": r.title,
        "summary": r.summary,
        "status": r.status,
        "createdAt": r.created_at.strftime("%Y-%m-%d %H:%M"),
        "content": r.content
    }


def _document_to_dict(d: Document) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "size": d.size,
        "status": d.status,
        "uploadedAt": d.uploaded_at.strftime("%Y-%m-%d %H:%M"),
    }


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
    reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).all()
    return [_report_to_dict(r) for r in reports]


@router.post("/reports")
def generate_report(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ticker = data.get("ticker", "AAPL").upper().strip()

    title = data.get("title") or f"{ticker} Deep Research Report"
    summary = data.get("summary") or f"Comprehensive AI-generated research on {ticker} financials and market sentiments."
    content = data.get("content") or (
        f"## {ticker} Research Report\n\n### Executive Summary\n"
        f"Analysis of {ticker} performance shows favorable technicals and strong fundamental growth.\n\n"
        f"### Key Metrics\nPE Ratio is in line with historical industry median. Return on Equity remains robust."
    )

    new_report = Report(
        user_id=user_id,
        ticker=ticker,
        title=title,
        summary=summary,
        status="completed",
        content=content,
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return _report_to_dict(new_report)


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(
    report_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return None


@router.get("/documents")
def get_documents(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.uploaded_at.desc()).all()
    return [_document_to_dict(d) for d in docs]


@router.post("/documents", status_code=201)
def create_document(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    name = data.get("name", "").strip()
    size = data.get("size", "0 B")
    status = data.get("status", "Processing")

    if not name:
        raise HTTPException(status_code=400, detail="Document name is required")

    doc = Document(user_id=user_id, name=name, size=size, status=status)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _document_to_dict(doc)


@router.patch("/documents/{doc_id}")
def update_document(
    doc_id: int,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if "status" in data:
        doc.status = data["status"]
    if "name" in data:
        doc.name = data["name"]

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _document_to_dict(doc)


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return None


@router.post("/chat")
async def chat_response(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    message = data.get("message", "")
    history = data.get("history")

    holdings_ctx = []
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    for h in holdings:
        cost_basis = h.shares * h.avg_cost
        market_value = h.shares * h.current_price
        pnl = market_value - cost_basis
        pnl_percent = (pnl / cost_basis * 100.0) if cost_basis > 0 else 0.0
        holdings_ctx.append({
            "ticker": h.ticker,
            "name": h.name,
            "shares": h.shares,
            "avgCost": h.avg_cost,
            "currentPrice": h.current_price,
            "pnl": pnl,
            "pnlPercent": pnl_percent,
        })

    reports_ctx = [
        {"ticker": r.ticker, "title": r.title}
        for r in db.query(Report).filter(Report.user_id == user_id)
                    .order_by(Report.created_at.desc()).limit(10).all()
    ]

    result = chat_service.chat(
        message=message,
        history=history,
        holdings=holdings_ctx or None,
        reports=reports_ctx or None,
    )
    return result
