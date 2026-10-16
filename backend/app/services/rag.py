"""LangChain PGVector indexing and retrieval for private chat documents."""

from __future__ import annotations

import hashlib
import io
import re
from typing import Any
from functools import lru_cache

from sqlalchemy.orm import Session

from app.database import settings
from app.models.research import Document, DocumentChunk

COLLECTION_NAME = "finpilot_chat_documents"
CHUNK_SIZE = 1_000
CHUNK_OVERLAP = 150


@lru_cache(maxsize=1)
def _langchain_components():
    from langchain_core.documents import Document as LCDocument
    from langchain_postgres import PGVector
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    provider = (settings.EMBEDDING_PROVIDER or "openai_compatible").strip().lower()
    if provider == "huggingface":
        from langchain_huggingface import HuggingFaceEndpointEmbeddings

        if not settings.HF_API_KEY:
            raise ValueError("HF_API_KEY is required for document embeddings")
        embeddings = HuggingFaceEndpointEmbeddings(
            model=settings.HF_EMBEDDING_MODEL,
            task="feature-extraction",
            huggingfacehub_api_token=settings.HF_API_KEY,
        )
    else:
        from langchain_openai import OpenAIEmbeddings

        api_key = settings.EMBEDDING_API_KEY or settings.LLM_API_KEY or settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("An embedding API key is required to index documents")
        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL or settings.OPENAI_EMBEDDING_MODEL,
            api_key=api_key,
            base_url=settings.EMBEDDING_BASE_URL or settings.LLM_BASE_URL or None,
        )

    connection = settings.DATABASE_URL
    connection = connection.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    if connection.startswith("postgres://"):
        connection = connection.replace("postgres://", "postgresql+psycopg://", 1)
    elif connection.startswith("postgresql://"):
        connection = connection.replace("postgresql://", "postgresql+psycopg://", 1)
    if not connection.startswith("postgresql+psycopg://"):
        raise ValueError("Document vector search requires the PostgreSQL pgvector database used by Docker Compose")
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=connection,
        use_jsonb=True,
    )
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    return LCDocument, vector_store, splitter


def extract_pages(raw: bytes, filename: str, mime_type: str | None) -> list[tuple[int | None, str]]:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "pdf" or mime_type == "application/pdf":
        try:
            from pypdf import PdfReader
            return [(index + 1, page.extract_text() or "") for index, page in enumerate(PdfReader(io.BytesIO(raw)).pages)]
        except Exception as error:
            raise ValueError(f"PDF extraction failed: {error}") from error
    if suffix in {"txt", "md", "csv", "json", "log"} or (mime_type and mime_type.startswith("text/")):
        try:
            return [(None, raw.decode("utf-8-sig"))]
        except UnicodeDecodeError as error:
            raise ValueError("Text documents must be UTF-8 encoded") from error
    raise ValueError("Supported document types are PDF, TXT, Markdown, CSV, JSON, and LOG")


def _vector_ids(document_id: int, chunk_count: int) -> list[str]:
    return [f"doc-{document_id}-chunk-{index}" for index in range(chunk_count)]


async def index_document(db: Session, document: Document, raw: bytes) -> int:
    LCDocument, vector_store, splitter = _langchain_components()
    pages = [(page, re.sub(r"\n{3,}", "\n\n", text).strip()) for page, text in extract_pages(raw, document.name, document.mime_type)]
    pages = [(page, text) for page, text in pages if text]
    if not pages:
        raise ValueError("The document contains no extractable text")

    old_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).all()
    if old_chunks:
        vector_store.delete(ids=_vector_ids(document.id, len(old_chunks)))
    lc_docs = []
    for page, text in pages:
        split_docs = splitter.create_documents([text])
        for split_doc in split_docs:
            lc_docs.append(LCDocument(page_content=split_doc.page_content, metadata={
                "user_id": document.user_id,
                "document_id": document.id,
                "document": document.name,
                "page": page,
                "chunk": len(lc_docs),
            }))
    if not lc_docs:
        raise ValueError("The document contains no indexable text")

    document.extracted_text = "\n\n".join(text for _, text in pages)
    document.error = None
    document.status = "Indexed"
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete(synchronize_session=False)
    vector_store.add_documents(lc_docs, ids=_vector_ids(document.id, len(lc_docs)))
    for index, item in enumerate(lc_docs):
        page = item.metadata["page"]
        db.add(DocumentChunk(document_id=document.id, chunk_index=index, page=page, text=item.page_content, character_count=len(item.page_content), embedding="pgvector"))
    db.commit()
    return len(lc_docs)


async def retrieve_documents(
    db: Session,
    query: str,
    user_id: int,
    document_ids: list[int] | None = None,
    limit: int = 6,
) -> list[dict[str, Any]]:
    LCDocument, vector_store, _ = _langchain_components()
    if document_ids is not None and not document_ids:
        return []

    # Backfill chunks created by the earlier SQL/JSON embedding implementation.
    from sqlalchemy import or_

    legacy = db.query(DocumentChunk, Document).join(Document, Document.id == DocumentChunk.document_id).filter(
        Document.user_id == user_id,
        Document.status == "Indexed",
        or_(DocumentChunk.embedding.is_(None), DocumentChunk.embedding != "pgvector"),
    )
    if document_ids is not None:
        legacy = legacy.filter(Document.id.in_(document_ids))
    legacy_rows = legacy.all()
    if legacy_rows:
        legacy_docs = [
            LCDocument(page_content=chunk.text, metadata={
                "user_id": user_id,
                "document_id": document.id,
                "document": document.name,
                "page": chunk.page,
                "chunk": chunk.chunk_index,
            })
            for chunk, document in legacy_rows
        ]
        vector_store.add_documents(
            legacy_docs,
            ids=[f"doc-{document.id}-chunk-{chunk.chunk_index}" for chunk, document in legacy_rows],
        )
        for chunk, _ in legacy_rows:
            chunk.embedding = "pgvector"
        db.commit()

    filters: dict[str, Any] = {"user_id": {"$eq": user_id}}
    if document_ids is not None:
        filters["document_id"] = {"$in": document_ids}
    results = vector_store.similarity_search_with_relevance_scores(query, k=limit, filter=filters)
    return [
        {
            "document_id": item.metadata["document_id"],
            "document": item.metadata["document"],
            "chunk": item.metadata["chunk"],
            "page": item.metadata.get("page"),
            "text": item.page_content,
            "score": round(float(score), 6),
            "citation": {
                "document_id": item.metadata["document_id"],
                "document": item.metadata["document"],
                "page": item.metadata.get("page"),
                "chunk": item.metadata["chunk"],
            },
        }
        for item, score in results
        if score > 0
    ]


def delete_document_vectors(document_id: int, chunk_count: int) -> None:
    if not chunk_count:
        return
    _, vector_store, _ = _langchain_components()
    vector_store.delete(ids=_vector_ids(document_id, chunk_count))


def checksum(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()
