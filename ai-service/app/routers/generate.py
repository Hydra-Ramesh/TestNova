"""Question generation API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.agents.question_generator import generate_questions

router = APIRouter()


class GenerateRequest(BaseModel):
    exam_type: str
    subjects: List[str]
    chapters: List[str] = []
    difficulty: str = "mixed"
    num_questions: int = 30
    test_type: str = "full_mock"


@router.post("/questions")
async def generate_exam_questions(req: GenerateRequest):
    """Generate AI-powered exam questions."""
    try:
        questions = generate_questions(
            exam_type=req.exam_type,
            subjects=req.subjects,
            chapters=req.chapters,
            difficulty=req.difficulty,
            num_questions=req.num_questions,
            test_type=req.test_type,
        )

        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions")

        return {"questions": questions, "count": len(questions)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
