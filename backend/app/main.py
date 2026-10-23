from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import engine, Base

# Import all models to ensure they are created in the SQLite database
from app.models.user import User
from app.models.market import MarketCache, MarketQuote
from app.models.stock import Stock, PriceBar
from app.models.research import Document, DocumentChunk
from app.models.conversation import ChatConversation, ChatMessage, ChatConversationDocument

# Import routers
from app.auth import router as auth_router
from app.api.v1.market import router as market_router
from app.routers.chat import router as chat_router
from app.routers.ai import router as ai_router
from app.observability import request_context

# Create database tables
Base.metadata.create_all(bind=engine)


def _ensure_chat_document_columns():
    additions = {
        "documents": {
            "mime_type": "VARCHAR(120)",
            "checksum": "VARCHAR(64)",
            "extracted_text": "TEXT",
            "error": "TEXT",
        },
        "document_chunks": {
            "page": "INTEGER",
            "character_count": "INTEGER DEFAULT 0",
            "embedding": "TEXT",
        },
    }
    with engine.begin() as connection:
        inspector = inspect(connection)
        for table, columns in additions.items():
            existing = {column["name"] for column in inspector.get_columns(table)}
            for column, definition in columns.items():
                if column not in existing:
                    connection.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {definition}'))


_ensure_chat_document_columns()


# Initialize FastAPI App
app = FastAPI(
    title="FinPilot API",
    description="FastAPI Python backend for the FinPilot AI financial intelligence platform.",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://fin-pilot-sooty.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(request_context)

# Register routers
app.include_router(auth_router)
app.include_router(market_router)
app.include_router(chat_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {
        "message": "FinPilot API is running",
        "status": "healthy"
    }


@app.get("/health/live", tags=["health"])
def liveness():
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def readiness():
    checks = {"database": "ok"}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as error:
        checks["database"] = f"error: {error}"
        return {"status": "not_ready", "checks": checks}
    return {"status": "ready", "checks": checks}
