"""
Solution Explainer Agent
Generates step-by-step solutions and concept explanations.
"""

import logging
from typing import Dict, Optional
from app.services.groq_manager import groq_manager
from app.services.cache_service import cache_get, cache_set
from app.config import settings

logger = logging.getLogger(__name__)


def explain_solution(question_data: Dict) -> Dict:
    """Generate detailed solution explanation for a question."""

    cache_key = f"solution:{question_data.get('_id', hash(question_data.get('question', '')))}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    question_text = question_data.get("question", "")
    options = question_data.get("options", [])
    correct = question_data.get("correctAnswer", "")
    subject = question_data.get("subject", "")
    chapter = question_data.get("chapter", "")

    options_text = "\n".join([f"{o['id']}. {o['text']}" for o in options]) if options else "Numerical answer question"

    prompt = f"""You are an expert {subject} tutor for Indian competitive exams (JEE/NEET).

Provide a detailed step-by-step solution for this exam question.

Question: {question_text}

Options:
{options_text}

Correct Answer: {correct}
Topic: {chapter}

Please provide:
1. A clear step-by-step solution (number each step)
2. Key concept explanation
3. Common mistakes to avoid
4. A memory tip or shortcut if applicable

Format your response as JSON:
{{
  "steps": [
    {{"step": 1, "content": "step description"}},
    {{"step": 2, "content": "step description"}}
  ],
  "concept": "detailed concept explanation",
  "commonMistakes": "common mistakes students make",
  "tip": "shortcut or memory tip"
}}"""

    response = groq_manager.chat_completion(
        messages=[
            {"role": "system", "content": "You are a precise exam tutor. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        model=settings.groq_chat_model,
        temperature=0.5,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    result = {
        "explanation": "Solution generation in progress...",
        "steps": [],
        "concept": "",
    }

    if response:
        try:
            import json
            parsed = json.loads(response)
            result = {
                "explanation": parsed.get("concept", ""),
                "steps": parsed.get("steps", []),
                "concept": parsed.get("concept", ""),
                "commonMistakes": parsed.get("commonMistakes", ""),
                "tip": parsed.get("tip", ""),
            }
            cache_set(cache_key, result)
        except Exception as e:
            logger.error(f"Solution parse error: {e}")
            result["explanation"] = response

    return result
