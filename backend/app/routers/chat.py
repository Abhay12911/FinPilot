from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.orchestration import answer_query
from app.database import get_db

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    current_symbol: str | None = Field(default=None, max_length=50)


class ChatResponse(BaseModel):
    answer: str
    route: str
    citations: list[dict] = Field(default_factory=list)
    provider: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        result = await answer_query(db, request.message, request.current_symbol)
        return {"answer": result["answer"], "route": result["route"], "citations": result["citations"], "provider": result["provider"]}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"FinPilot AI request failed: {error}") from error
