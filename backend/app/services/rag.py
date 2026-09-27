"""Document extraction, chunking, embeddings, and hybrid retrieval."""

from __future__ import annotations

import hashlib
import json
import math
import re
from typing import Any

import httpx

from sqlalchemy.orm import Session

from app.database import settings
from app.models.research import Document, DocumentChunk

CHUNK_SIZE = 1_600
CHUNK_OVERLAP = 240


def extract_text(raw: bytes, filename: str, mime_type: str | None) -> str:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "pdf" or mime_type == "application/pdf":
        try:
            from pypdf import PdfReader
            import io
            pages = PdfReader(io.BytesIO(raw)).pages
            return "\n\n".join(page.extract_text() or "" for page in pages)
        except ImportError as error:
            raise ValueError("PDF extraction requires pypdf in backend requirements") from error
        except Exception as error:
            raise ValueError(f"PDF extraction failed: {error}") from error
    if suffix in {"txt", "md", "csv", "json", "log"} or (mime_type and mime_type.startswith("text/")):
        try:
            return raw.decode("utf-8")
        except UnicodeDecodeError as error:
            raise ValueError("Text documents must be UTF-8 encoded") from error
    raise ValueError("Supported document types are PDF, TXT, Markdown, CSV, JSON, and LOG")


def normalize_text(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", text)).strip()


def chunk_text(text: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) + 2 > CHUNK_SIZE:
            chunks.append(current.strip())
            overlap = current[-CHUNK_OVERLAP:]
            current = f"{overlap}\n\n{paragraph}"
        else:
            current = f"{current}\n\n{paragraph}".strip()
    if current:
        chunks.append(current.strip())
    return chunks


async def create_embeddings(texts: list[str]) -> list[list[float] | None]:
    if not texts:
        return [None for _ in texts]
    if settings.EMBEDDING_PROVIDER.strip().lower() == "huggingface":
        if not settings.HF_API_KEY:
            return [None for _ in texts]
        url = f"{settings.HF_EMBEDDING_URL.rstrip('/')}/{settings.HF_EMBEDDING_MODEL}"
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.HF_API_KEY}"},
                json={"inputs": texts, "options": {"wait_for_model": True}},
            )
        response.raise_for_status()
        payload = response.json()
        return _normalize_embedding_payload(payload, len(texts))
    if not (settings.EMBEDDING_API_KEY or settings.OPENAI_API_KEY):
        return [None for _ in texts]
    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        api_key=settings.EMBEDDING_API_KEY or settings.OPENAI_API_KEY,
        base_url=settings.EMBEDDING_BASE_URL or None,
    )
    response = await client.embeddings.create(
        model=settings.EMBEDDING_MODEL or settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
    )
    by_index = {item.index: item.embedding for item in response.data}
    return [by_index.get(index) for index in range(len(texts))]


async def index_document(db: Session, document: Document, raw: bytes) -> int:
    text = normalize_text(extract_text(raw, document.name, document.mime_type))
    if not text:
        raise ValueError("The document contains no extractable text")
    chunks = chunk_text(text)
    embeddings = await create_embeddings(chunks)
    document.extracted_text = text
    document.error = None
    document.status = "Indexed"
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(DocumentChunk(
            document_id=document.id,
            chunk_index=index,
            text=chunk,
            character_count=len(chunk),
            embedding=json.dumps(embedding) if embedding is not None else None,
        ))
    db.commit()
    return len(chunks)


def _terms(value: str) -> set[str]:
    return {term for term in re.findall(r"[a-z0-9]{3,}", value.lower())}


def _lexical_score(query: str, text: str) -> float:
    wanted = _terms(query)
    available = _terms(text)
    return len(wanted & available) / len(wanted) if wanted else 0.0


def _cosine(left: list[float], right: list[float]) -> float:
    numerator = sum(a * b for a, b in zip(left, right))
    denominator = math.sqrt(sum(a * a for a in left)) * math.sqrt(sum(b * b for b in right))
    return numerator / denominator if denominator else 0.0


def _normalize_embedding_payload(payload: Any, expected: int) -> list[list[float]]:
    """Normalize HF sentence or token-level responses to one vector per input."""
    if expected == 1 and payload and isinstance(payload[0], (int, float)):
        return [payload]
    vectors = []
    for item in payload:
        if item and isinstance(item[0], (int, float)):
            vectors.append(item)
            continue
        token_vectors = item or []
        width = len(token_vectors[0]) if token_vectors else 0
        vectors.append(
            [sum(token[index] for token in token_vectors) / len(token_vectors) for index in range(width)]
            if width else []
        )
    return vectors


async def retrieve_documents(db: Session, query: str, user_id: int | None = None, limit: int = 5) -> list[dict[str, Any]]:
    statement = db.query(DocumentChunk, Document).join(Document, Document.id == DocumentChunk.document_id)
    if user_id is not None:
        statement = statement.filter(Document.user_id == user_id)
    rows = statement.filter(Document.status == "Indexed").all()
    query_embedding = (await create_embeddings([query]))[0]
    scored = []
    for chunk, document in rows:
        lexical = _lexical_score(query, chunk.text)
        vector = 0.0
        if query_embedding and chunk.embedding:
            vector = _cosine(query_embedding, json.loads(chunk.embedding))
        score = 0.55 * lexical + 0.45 * vector if query_embedding else lexical
        if score > 0:
            scored.append((score, chunk, document, lexical, vector))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "document_id": document.id,
            "document": document.name,
            "chunk": chunk.chunk_index,
            "text": chunk.text,
            "score": round(score, 6),
            "lexical_score": round(lexical, 6),
            "vector_score": round(vector, 6),
            "citation": {"document_id": document.id, "document": document.name, "chunk": chunk.chunk_index},
        }
        for score, chunk, document, lexical, vector in scored[:limit]
    ]


def checksum(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()