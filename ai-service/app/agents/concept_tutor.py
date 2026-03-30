"""
Concept Tutor Agent
RAG-powered concept explanation for the AI chatbot.
"""

import logging
from typing import Optional
from app.services.groq_manager import groq_manager
from app.rag.pipeline import rag_pipeline
from app.config import settings

logger = logging.getLogger(__name__)


def tutor_respond(message: str, question_id: Optional[str] = None, context: str = "") -> dict:
    """Generate a tutoring response using RAG context."""

    # Retrieve relevant context
    rag_context = rag_pipeline.retrieve_context(
        query=message,
        top_k=3,
    )

    context_text = "\n".join([doc.get("text", "") for doc in rag_context]) if rag_context else ""

    system_prompt = f"""You are TestNova AI Tutor — an expert tutor for JEE Main, JEE Advanced, and NEET preparation.

Your role:
- Explain concepts clearly with examples
- Provide step-by-step solutions
- Suggest alternate approaches
- Generate similar practice questions when asked
- Be encouraging and supportive

{f'Relevant knowledge context:{chr(10)}{context_text}' if context_text else ''}

Rules:
- Use simple language that Indian students can understand
- Include relevant formulas in text form
- Give exam tips when appropriate
- Keep responses concise but thorough"""

    messages = [
        {"role": "system", "content": system_prompt},
    ]

    # Add conversation context
    if context:
        messages.append({"role": "user", "content": f"Previous conversation context:\n{context}"})

    messages.append({"role": "user", "content": message})

    response = groq_manager.chat_completion(
        messages=messages,
        model=settings.groq_chat_model,
        temperature=0.7,
        max_tokens=1500,
    )

    sources = []
    if rag_context:
        sources = [{"subject": doc.get("subject", ""), "chapter": doc.get("chapter", "")} for doc in rag_context]

    return {
        "reply": response or "I apologize, but I'm having trouble right now. Please try again.",
        "sources": sources,
    }
