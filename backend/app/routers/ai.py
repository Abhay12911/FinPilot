from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.orchestration import answer_query
from app.ai.evaluation import run_route_evaluation
from app.database import get_db

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


class AIQueryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4_000)
    current_symbol: str | None = Field(default=None, max_length=50)
    user_id: int | None = Field(default=None, ge=1)


@router.post("/query")
async def query_ai(request: AIQueryRequest, db: Session = Depends(get_db)):
    try:
        return await answer_query(db, request.message, request.current_symbol, request.user_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/evidence")
async def collect_evidence(request: AIQueryRequest, db: Session = Depends(get_db)):
    try:
        result = await answer_query(db, request.message, request.current_symbol, request.user_id)
        return {"route": result["route"], "evidence": result["evidence"], "citations": result["citations"]}
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/evaluations/routing")
def evaluate_routing():
    return run_route_evaluation()