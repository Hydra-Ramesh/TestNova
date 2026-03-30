"""AI Tutor chatbot API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.agents.concept_tutor import tutor_respond

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    question_id: Optional[str] = None
    context: Optional[str] = ""
    user_id: Optional[str] = None


@router.post("/message")
async def chat(req: ChatRequest):
    """Send message to AI tutor chatbot."""
    try:
        result = tutor_respond(
            message=req.message,
            question_id=req.question_id,
            context=req.context or "",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
