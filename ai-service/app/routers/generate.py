"""Question generation API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.agents.question_generator import generate_questions

router = APIRouter()


class DistributionItem(BaseModel):
    subject: str
    questionType: str
    count: int
    sectionLabel: str = ""
    paper: str = ""


class GenerateRequest(BaseModel):
    exam_type: str
    subjects: List[str]
    chapters: List[str] = []
    difficulty: str = "mixed"
    num_questions: int = 30
    test_type: str = "full_mock"
    distribution: List[DistributionItem] = []


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
            distribution=[d.model_dump() for d in req.distribution] if req.distribution else None,
        )

        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions")

        return {"questions": questions, "count": len(questions)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
