"""
Question Generator Agent
Generates unique exam questions using RAG + Groq LLM.
"""

import json
import logging
import hashlib
from typing import List, Dict, Optional
from app.services.groq_manager import groq_manager
from app.rag.pipeline import rag_pipeline
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)

QUESTION_TYPE_MAP = {
    "jee_main": ["single_correct", "numerical"],
    "jee_advanced": ["single_correct", "multiple_correct", "numerical", "integer", "matrix_match"],
    "neet": ["single_correct"],
}

MARKING_SCHEME = {
    "jee_main": {
        "single_correct": {"correct": 4, "incorrect": -1, "partial": 0},
        "numerical": {"correct": 4, "incorrect": 0, "partial": 0},
    },
    "jee_advanced": {
        "single_correct": {"correct": 4, "incorrect": -2, "partial": 0},
        "multiple_correct": {"correct": 4, "incorrect": -2, "partial": 1},
        "numerical": {"correct": 3, "incorrect": 0, "partial": 0},
        "integer": {"correct": 3, "incorrect": 0, "partial": 0},
        "matrix_match": {"correct": 4, "incorrect": -2, "partial": 1},
    },
    "neet": {
        "single_correct": {"correct": 4, "incorrect": -1, "partial": 0},
    },
}


def generate_questions(
    exam_type: str,
    subjects: List[str],
    chapters: List[str],
    difficulty: str,
    num_questions: int,
    test_type: str,
) -> List[Dict]:
    """Generate unique exam questions using AI."""

    cache_key = hashlib.md5(
        f"{exam_type}:{':'.join(subjects)}:{':'.join(chapters)}:{difficulty}:{num_questions}".encode()
    ).hexdigest()

    # Don't cache — each test should be unique. But cache context retrieval.
    questions = []
    per_subject = max(1, num_questions // max(len(subjects), 1))
    question_types = QUESTION_TYPE_MAP.get(exam_type, ["single_correct"])
    marks_map = MARKING_SCHEME.get(exam_type, {})

    for subject in subjects:
        subject_chapters = chapters if chapters else None
        count = per_subject if subject != subjects[-1] else num_questions - len(questions)

        # Retrieve relevant context from RAG
        rag_context = rag_pipeline.retrieve_context(
            query=f"{exam_type} {subject} {'  '.join(chapters) if chapters else 'full syllabus'}",
            subject=subject,
            exam_type=exam_type,
            top_k=5,
        )

        context_text = "\n".join([doc.get("text", "") for doc in rag_context]) if rag_context else ""

        # Build prompt
        q_type_instruction = ", ".join(question_types)
        prompt = f"""You are an expert exam question generator for Indian competitive exams.

Generate {count} unique questions for {exam_type.upper().replace('_', ' ')} exam.

Subject: {subject}
{f'Chapters: {", ".join(chapters)}' if chapters else 'Cover various chapters'}
Difficulty: {difficulty}
Question types allowed: {q_type_instruction}

{f'Use this syllabus context for accurate questions:{chr(10)}{context_text}' if context_text else ''}

CRITICAL RULES:
1. Questions MUST be conceptually accurate and exam-standard
2. Each question must be UNIQUE — no duplicates
3. Difficulty must match: easy = direct formula, medium = multi-step, hard = tricky/combining concepts
4. For single_correct MCQ: exactly 4 options (A, B, C, D), exactly one correct
5. For multiple_correct: exactly 4 options, 2-3 correct answers
6. For numerical: answer is a decimal number (no options needed)
7. For integer: answer is an integer (no options needed)
8. Provide detailed step-by-step solution
9. Include concept explanation

Return ONLY a valid JSON array. Each object must have:
{{
  "question": "full question text",
  "questionType": "single_correct|multiple_correct|numerical|integer",
  "options": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}, {{"id": "C", "text": "..."}}, {{"id": "D", "text": "..."}}],
  "correctAnswer": "A" or ["A", "C"] or 42.5,
  "difficulty": "easy|medium|hard",
  "subject": "{subject}",
  "chapter": "chapter name",
  "examType": "{exam_type}",
  "solutionSteps": [{{"step": 1, "content": "..."}}],
  "conceptExplanation": "brief concept explanation",
  "tags": ["tag1", "tag2"]
}}

For numerical/integer questions, set options to [] and correctAnswer to a number.
Generate exactly {count} questions. Return ONLY the JSON array, no other text."""

        response = groq_manager.chat_completion(
            messages=[
                {"role": "system", "content": "You are a precise exam question generator. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=8000,
            response_format={"type": "json_object"},
        )

        if response:
            try:
                parsed = json.loads(response)
                # Handle both direct array and wrapped object
                if isinstance(parsed, dict):
                    parsed = parsed.get("questions", parsed.get("data", []))
                if isinstance(parsed, list):
                    for q in parsed:
                        q_type = q.get("questionType", "single_correct")
                        q["marks"] = marks_map.get(q_type, {"correct": 4, "incorrect": -1, "partial": 0})
                        q["isAIGenerated"] = True
                        questions.append(q)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}")
                # Try to extract JSON array from response
                try:
                    start = response.index("[")
                    end = response.rindex("]") + 1
                    parsed = json.loads(response[start:end])
                    for q in parsed:
                        q_type = q.get("questionType", "single_correct")
                        q["marks"] = marks_map.get(q_type, {"correct": 4, "incorrect": -1, "partial": 0})
                        q["isAIGenerated"] = True
                        questions.append(q)
                except (ValueError, json.JSONDecodeError):
                    logger.error("Failed to parse AI response")

    return questions[:num_questions]
