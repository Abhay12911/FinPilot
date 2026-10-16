from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Index

from app.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False, default="New chat")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (Index("ix_chat_messages_conversation_created", "conversation_id", "created_at"),)


class ChatConversationDocument(Base):
    __tablename__ = "chat_conversation_documents"

    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
