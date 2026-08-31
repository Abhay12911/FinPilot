from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import all models to ensure they are created in the SQLite database
from app.models.user import User
from app.models.portfolio import Holding, WatchlistItem
from app.models.research import Report, Document
from app.models.news import NewsArticle
from app.models.market import MarketCache, MarketQuote

# Import routers
from app.auth import router as auth_router
from app.routers.portfolio import router as portfolio_router
from app.routers.companies import router as companies_router
from app.routers.research import router as research_router
from app.api.v1.market import router as market_router
from app.api.v1.news import router as news_router

# Create database tables
Base.metadata.create_all(bind=engine)

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(companies_router)
app.include_router(research_router)
app.include_router(market_router)
app.include_router(news_router)

@app.get("/")
def root():
    return {
        "message": "FinPilot API is running",
        "status": "healthy"
    }
