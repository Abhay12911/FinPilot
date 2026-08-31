from sqlalchemy import Column, Integer, String, DateTime
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
