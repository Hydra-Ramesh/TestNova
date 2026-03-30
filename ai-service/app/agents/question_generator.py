"""
Question Generator Agent
Generates unique exam questions using RAG + Groq LLM.
Uses official exam patterns for JEE Main, JEE Advanced, and NEET.
"""

import json
import logging
import hashlib
from typing import List, Dict, Optional
from app.services.groq_manager import groq_manager
from app.rag.pipeline import rag_pipeline
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)

MARKING_SCHEME = {
    "jee_main": {
        "single_correct": {"correct": 4, "incorrect": -1, "partial": 0},
        "numerical": {"correct": 4, "incorrect": 0, "partial": 0},
    },
    "jee_advanced": {
        "single_correct": {"correct": 3, "incorrect": -1, "partial": 0},
        "multiple_correct": {"correct": 4, "incorrect": -2, "partial": 1},
        "numerical": {"correct": 3, "incorrect": 0, "partial": 0},
        "integer": {"correct": 3, "incorrect": 0, "partial": 0},
        "matrix_match": {"correct": 3, "incorrect": -1, "partial": 0},
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
    distribution: Optional[List[Dict]] = None,
) -> List[Dict]:
    """Generate unique exam questions using AI with precise distribution."""

    questions = []
    marks_map = MARKING_SCHEME.get(exam_type, {})

    if distribution:
        # Use precise distribution from backend
        for dist in distribution:
            subject = dist["subject"]
            q_type = dist["questionType"]
            count = dist["count"]
            section_label = dist.get("sectionLabel", "")

            batch = _generate_batch(
                exam_type=exam_type,
                subject=subject,
                question_type=q_type,
                count=count,
                chapters=chapters,
                difficulty=difficulty,
                section_label=section_label,
                marks_map=marks_map,
            )
            questions.extend(batch)
    else:
        # Fallback: distribute evenly
        per_subject = max(1, num_questions // max(len(subjects), 1))
        for subject in subjects:
            count = per_subject if subject != subjects[-1] else num_questions - len(questions)
            q_type = "single_correct"

            batch = _generate_batch(
                exam_type=exam_type,
                subject=subject,
                question_type=q_type,
                count=count,
                chapters=chapters,
                difficulty=difficulty,
                section_label=subject,
                marks_map=marks_map,
            )
            questions.extend(batch)

    return questions[:num_questions]


def _generate_batch(
    exam_type: str,
    subject: str,
    question_type: str,
    count: int,
    chapters: List[str],
    difficulty: str,
    section_label: str,
    marks_map: Dict,
) -> List[Dict]:
    """Generate a batch of questions for a specific subject and type."""

    # Retrieve RAG context
    rag_context = rag_pipeline.retrieve_context(
        query=f"{exam_type} {subject} {question_type} {'  '.join(chapters) if chapters else 'full syllabus'}",
        subject=subject,
        exam_type=exam_type,
        top_k=3,
    )
    context_text = "\n".join([doc.get("text", "") for doc in rag_context]) if rag_context else ""

    # Build type-specific instructions
    type_instructions = {
        "single_correct": """
- Exactly 4 options (A, B, C, D), exactly ONE correct answer
- correctAnswer should be a single letter like "A"
- Include all 4 options in the options array""",
        "multiple_correct": """
- Exactly 4 options (A, B, C, D), 2-3 correct answers
- correctAnswer should be an array like ["A", "C"] or ["A", "B", "D"]
- Students get PARTIAL marks if they select some correct options""",
        "numerical": """
- NO options needed (set options to empty array [])
- correctAnswer should be a decimal number like 42.5 or 3.14
- Answer can have up to 2 decimal places""",
        "integer": """
- NO options needed (set options to empty array [])
- correctAnswer should be an INTEGER like 42 or 7
- Only whole number answers""",
        "matrix_match": """
- 4 options showing different P→Q→R→S matching combinations
- correctAnswer should be a single letter like "A"
- Question should have 4 items in Column-I matched to Column-II""",
    }

    q_type_instruction = type_instructions.get(question_type, type_instructions["single_correct"])

    prompt = f"""You are an expert Indian competitive exam question generator.

Generate exactly {count} {question_type.replace('_', ' ').upper()} questions for {exam_type.upper().replace('_', ' ')}.

Section: {section_label}
Subject: {subject}
{f'Chapters: {", ".join(chapters)}' if chapters else 'Cover various chapters from the syllabus'}
Difficulty: {difficulty}

{f'Syllabus context:{chr(10)}{context_text}' if context_text else ''}

QUESTION TYPE RULES:{q_type_instruction}

CRITICAL RULES:
1. Questions MUST be at {exam_type.upper().replace('_', ' ')} exam standard — real exam difficulty
2. Each question must be UNIQUE, conceptually deep, and application-based
3. Difficulty levels: easy = direct formula, medium = 2-3 step, hard = multi-concept/tricky
4. Provide detailed step-by-step solution with formulas
5. Include concept explanation
6. Questions must test problem-solving, not just recall

Return ONLY a valid JSON array. Each object:
{{
  "question": "full question text with all necessary data",
  "questionType": "{question_type}",
  "options": [{{"id": "A", "text": "..."}}, ...] or [],
  "correctAnswer": "A" or ["A","C"] or 42.5,
  "difficulty": "easy|medium|hard",
  "subject": "{subject}",
  "chapter": "specific chapter name",
  "examType": "{exam_type}",
  "solutionSteps": [{{"step": 1, "content": "Step 1: ..."}}, {{"step": 2, "content": "Step 2: ..."}}],
  "conceptExplanation": "brief concept explanation",
  "tags": ["topic1", "topic2"]
}}

Generate EXACTLY {count} questions. Return ONLY the JSON array."""

    response = groq_manager.chat_completion(
        messages=[
            {"role": "system", "content": "You are an expert exam question creator for JEE and NEET. Return only valid JSON arrays."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.85,
        max_tokens=8000,
        response_format={"type": "json_object"},
    )

    questions = []
    if response:
        try:
            parsed = json.loads(response)
            if isinstance(parsed, dict):
                parsed = parsed.get("questions", parsed.get("data", list(parsed.values())[0] if parsed else []))
            if isinstance(parsed, list):
                for q in parsed:
                    q_type = q.get("questionType", question_type)
                    q["questionType"] = q_type
                    q["marks"] = marks_map.get(q_type, {"correct": 4, "incorrect": -1, "partial": 0})
                    q["isAIGenerated"] = True
                    questions.append(q)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            try:
                start = response.index("[")
                end = response.rindex("]") + 1
                parsed = json.loads(response[start:end])
                for q in parsed:
                    q_type = q.get("questionType", question_type)
                    q["marks"] = marks_map.get(q_type, {"correct": 4, "incorrect": -1, "partial": 0})
                    q["isAIGenerated"] = True
                    questions.append(q)
            except (ValueError, json.JSONDecodeError):
                logger.error("Failed to parse AI response")

    return questions[:count]
