"""Solution explanation API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from app.agents.solution_explainer import explain_solution

router = APIRouter()


class ExplainRequest(BaseModel):
    question_id: Optional[str] = None
    question_data: Optional[Dict] = None


@router.post("/solution")
async def explain(req: ExplainRequest):
    """Get AI-generated step-by-step solution explanation."""
    try:
        question_data = req.question_data or {"_id": req.question_id}
        result = explain_solution(question_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
