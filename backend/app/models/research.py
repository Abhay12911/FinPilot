from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Text, UniqueConstraint
from datetime import datetime
from app.database import Base

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    ticker = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    status = Column(String, default="completed") # pending, processing, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    content = Column(String, nullable=True) # JSON/Markdown content

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    size = Column(String, nullable=False)
    status = Column(String, default="Indexed") # Uploading, Processing, Indexed
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    mime_type = Column(String(120), nullable=True)
    checksum = Column(String(64), nullable=True, index=True)
    extracted_text = Column(Text, nullable=True)
    error = Column(Text, nullable=True)


class DocumentChunk(Base):
    """Searchable extracted text; embeddings can be added when pgvector is enabled."""
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    page = Column(Integer, nullable=True)
    character_count = Column(Integer, nullable=False, default=0)
    embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("document_id", "chunk_index", name="uq_document_chunk_index"),)
