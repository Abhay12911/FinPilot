from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db, settings
from app.auth import get_current_user
from app.models.research import Document, DocumentChunk, Report
from app.ai.orchestration import answer_query
from app.services.rag import checksum, index_document, retrieve_documents
from typing import List, Dict, Any

router = APIRouter(
    prefix="/research",
    tags=["research"]
)

# Seeding helper for default reports
def ensure_default_reports(user_id: int, db: Session):
    # Reports are created only by the grounded research workflow.
    return

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
async def generate_report(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["id"]
    ticker = data.get("ticker", "AAPL").upper()
    if not ticker:
        raise HTTPException(status_code=422, detail="ticker is required")
    question = data.get("question") or f"Provide a research report for {ticker} using current market data and available indexed evidence."
    try:
        result = await answer_query(db, question, ticker, user_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    title = f"{ticker} Deep Research Report"
    summary = f"Evidence-grounded research response for {ticker}."
    
    new_report = Report(
        user_id=user_id,
        ticker=ticker,
        title=title,
        summary=summary,
        status="completed",
        content=result["answer"]
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
async def chat_response(
    data: dict,
    current_user: dict = Depends(get_current_user)
    , db: Session = Depends(get_db)
):
    message = str(data.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=422, detail="message is required")
    try:
        result = await answer_query(db, message, data.get("current_symbol"), current_user["id"])
        return {
            "content": result["answer"],
            "answer": result["answer"],
            "route": result["route"],
            "citations": result["citations"],
            "provider": result["provider"],
        }
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user["id"]).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"message": "Report deleted"}


@router.get("/documents")
def list_documents(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = db.query(Document).filter(Document.user_id == current_user["id"]).order_by(Document.uploaded_at.desc()).all()
    return [{"id": document.id, "name": document.name, "size": document.size, "status": document.status, "uploadedAt": document.uploaded_at.isoformat()} for document in documents]


@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw = await file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Documents are limited to 10 MB")
    document_checksum = checksum(raw)
    duplicate = db.query(Document).filter(Document.user_id == current_user["id"], Document.checksum == document_checksum).first()
    if duplicate:
        return {"id": duplicate.id, "name": duplicate.name, "size": duplicate.size, "status": duplicate.status, "chunks": db.query(DocumentChunk).filter(DocumentChunk.document_id == duplicate.id).count(), "duplicate": True}
    document = Document(user_id=current_user["id"], name=file.filename or "document.txt", size=str(len(raw)), mime_type=file.content_type, checksum=document_checksum, status="Processing")
    db.add(document)
    db.flush()
    try:
        chunk_count = await index_document(db, document, raw)
    except ValueError as error:
        document.status = "Failed"
        document.error = str(error)
        db.commit()
        raise HTTPException(status_code=415, detail=str(error)) from error
    db.refresh(document)
    return {"id": document.id, "name": document.name, "size": document.size, "status": document.status, "chunks": chunk_count, "embedding_model": settings.EMBEDDING_MODEL if (settings.EMBEDDING_API_KEY or settings.OPENAI_API_KEY) else None}


@router.get("/documents/search")
async def search_documents(
    q: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not q.strip():
        raise HTTPException(status_code=422, detail="q must not be empty")
    return await retrieve_documents(db, q, current_user["id"], 10)


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user["id"]).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
    db.delete(document)
    db.commit()
    return {"message": "Document deleted"}
