"""Embeddings processing API router."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.rag.pipeline import rag_pipeline

router = APIRouter()


class ProcessDocRequest(BaseModel):
    document_id: str
    content: str
    subject: str
    chapter: str
    exam_type: str


@router.post("/process")
async def process_document(req: ProcessDocRequest):
    """Process a document and store embeddings in vector DB."""
    try:
        success = rag_pipeline.process_document(
            document_id=req.document_id,
            content=req.content,
            subject=req.subject,
            chapter=req.chapter,
            exam_type=req.exam_type,
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process document")
        return {"status": "processed", "document_id": req.document_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
