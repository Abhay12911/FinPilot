"""Authenticated chat, conversation memory, and private document RAG endpoints."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.agent import answer_document_question
from app.ai.orchestration import answer_query
from app.ai.providers import configured_provider
from app.auth import get_current_user
from app.database import get_db, settings
from app.models.conversation import ChatConversation, ChatMessage, ChatConversationDocument
from app.models.research import Document, DocumentChunk
from app.services.rag import checksum, delete_indexed_document, index_document, retrieve_documents

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    current_symbol: str | None = Field(default=None, max_length=50)
    document_ids: list[int] = Field(default_factory=list, max_length=20)


def _conversation_summary(conversation: ChatConversation) -> dict:
    return {"id": conversation.id, "title": conversation.title, "created_at": conversation.created_at.isoformat(), "updated_at": conversation.updated_at.isoformat()}


def _owned_conversation(db: Session, conversation_id: int, user_id: int) -> ChatConversation:
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id, ChatConversation.user_id == user_id).first()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/conversations")
def list_conversations(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ChatConversation).filter(ChatConversation.user_id == current_user["id"]).order_by(ChatConversation.updated_at.desc(), ChatConversation.id.desc()).all()
    return [_conversation_summary(row) for row in rows]


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
def create_conversation(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = ChatConversation(user_id=current_user["id"], title="New chat")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return _conversation_summary(conversation)


@router.post("")
async def chat_once(request: ChatMessageRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Keep the original single-turn URL working while saving it as a conversation."""
    conversation = ChatConversation(user_id=current_user["id"], title="New chat")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return await send_message(conversation.id, request, current_user, db)


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = _owned_conversation(db, conversation_id, current_user["id"])
    messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation.id).order_by(ChatMessage.id.asc()).all()
    document_ids = [row.document_id for row in db.query(ChatConversationDocument.document_id).filter(ChatConversationDocument.conversation_id == conversation.id).all()]
    return {**_conversation_summary(conversation), "document_ids": document_ids, "messages": [{"id": row.id, "role": row.role, "content": row.content, "citations": json.loads(row.citations or "[]"), "created_at": row.created_at.isoformat()} for row in messages]}


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = _owned_conversation(db, conversation_id, current_user["id"])
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation.id).delete(synchronize_session=False)
    db.query(ChatConversationDocument).filter(ChatConversationDocument.conversation_id == conversation.id).delete(synchronize_session=False)
    db.delete(conversation)
    db.commit()


@router.get("/documents")
def list_documents(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Document).filter(Document.user_id == current_user["id"]).order_by(Document.uploaded_at.desc(), Document.id.desc()).all()
    return [{"id": row.id, "name": row.name, "size": row.size, "mime_type": row.mime_type, "status": row.status, "error": row.error, "provider": "huggingface" if row.status == "Indexed" else None, "uploaded_at": row.uploaded_at.isoformat(), "chunks": db.query(DocumentChunk).filter(DocumentChunk.document_id == row.id).count()} for row in rows]


@router.post("/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    raw = await file.read(MAX_DOCUMENT_BYTES + 1)
    if len(raw) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail="Documents are limited to 10 MB")
    if not raw:
        raise HTTPException(status_code=422, detail="The uploaded document is empty")
    name = (file.filename or "document.txt").replace("\\", "/").split("/")[-1].strip()
    if not name:
        raise HTTPException(status_code=422, detail="The uploaded document needs a filename")
    digest = checksum(raw)
    duplicate = db.query(Document).filter(Document.user_id == current_user["id"], Document.checksum == digest).first()
    if duplicate:
        if duplicate.status != "Failed":
            return {"id": duplicate.id, "name": duplicate.name, "size": duplicate.size, "status": duplicate.status, "chunks": db.query(DocumentChunk).filter(DocumentChunk.document_id == duplicate.id).count(), "duplicate": True}
        document = duplicate
        document.name = name[:255]
        document.size = str(len(raw))
        document.mime_type = file.content_type
        document.status = "Processing"
        document.error = None
    else:
        document = Document(user_id=current_user["id"], name=name[:255], size=str(len(raw)), mime_type=file.content_type, checksum=digest, status="Processing")
        db.add(document)
        db.flush()
    # Keep the upload record even if embedding or vector indexing fails.
    db.commit()
    try:
        chunk_count = await index_document(db, document, raw)
    except ValueError as error:
        document.status = "Failed"
        document.error = str(error)
        db.commit()
        raise HTTPException(status_code=415, detail=str(error)) from error
    except Exception as error:
        # Embedding and vector storage can fail with exceptions other than
        # ValueError. Preserve the
        # failure on the document and return a useful API response instead of
        # leaving the client with an unhandled 500.
        db.rollback()
        document = db.query(Document).filter(
            Document.user_id == current_user["id"], Document.checksum == digest
        ).first()
        if document is not None:
            document.status = "Failed"
            document.error = str(error)
            db.commit()
        raise HTTPException(status_code=502, detail=f"Document indexing failed: {error}") from error
    db.refresh(document)
    return {"id": document.id, "name": document.name, "size": document.size, "status": document.status, "chunks": chunk_count, "provider": "huggingface", "duplicate": False}


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user["id"]).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).count()
    delete_indexed_document(document, chunk_count)
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete(synchronize_session=False)
    db.query(ChatConversationDocument).filter(ChatConversationDocument.document_id == document.id).delete(synchronize_session=False)
    db.delete(document)
    db.commit()


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: int, request: ChatMessageRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["id"]
    conversation = _owned_conversation(db, conversation_id, user_id)
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="message must not be blank")

    selected_ids = list(dict.fromkeys(request.document_ids))
    if selected_ids:
        selected_documents = db.query(Document).filter(Document.user_id == user_id, Document.id.in_(selected_ids)).all()
        if {document.id for document in selected_documents} != set(selected_ids):
            raise HTTPException(status_code=404, detail="One or more selected documents were not found")
        not_indexed = [document.name for document in selected_documents if document.status != "Indexed"]
        if not_indexed:
            raise HTTPException(status_code=409, detail=f"Document is not ready for chat: {', '.join(not_indexed)}")

    previous = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation.id).order_by(ChatMessage.id.desc()).limit(12).all()
    previous.reverse()
    history = [{"role": row.role, "content": row.content} for row in previous]
    citations: list[dict] = []
    route_name = "document_rag" if selected_ids else "chat"
    try:
        if selected_ids:
            prior_user_context = [row["content"] for row in history if row["role"] == "user"][-2:]
            retrieval_query = "\n".join([*prior_user_context, message])
            retrieved = await retrieve_documents(db, retrieval_query, user_id, selected_ids, limit=7)
            citations = [item["citation"] for item in retrieved]
            if not retrieved:
                answer, provider_name = "I couldn't find relevant passages in the selected document(s). Try asking about a specific section, table, or term.", "document-retrieval"
            else:
                answer = await answer_document_question(message, retrieved, history)
                provider = configured_provider()
                provider_name = provider.name if provider else ""

        else:
            result = await answer_query(db, message, request.current_symbol, history)
            answer, citations, provider_name = result["answer"], result["citations"], result["provider"]
            route_name = result["route"]
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"FinPilot chat request failed: {error}") from error

    now = datetime.now(timezone.utc)
    if conversation.title == "New chat":
        conversation.title = message[:77] + ("..." if len(message) > 78 else "")
    conversation.updated_at = now
    db.query(ChatConversationDocument).filter(ChatConversationDocument.conversation_id == conversation.id).delete(synchronize_session=False)
    for document_id in selected_ids:
        db.add(ChatConversationDocument(conversation_id=conversation.id, document_id=document_id))
    db.add(ChatMessage(conversation_id=conversation.id, role="user", content=message, citations="[]"))
    assistant_message = ChatMessage(conversation_id=conversation.id, role="assistant", content=answer, citations=json.dumps(citations, ensure_ascii=False))
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    return {"conversation_id": conversation.id, "answer": answer, "route": route_name, "citations": citations, "provider": provider_name, "model": settings.LLM_MODEL or settings.OPENAI_MODEL, "message_id": assistant_message.id}
