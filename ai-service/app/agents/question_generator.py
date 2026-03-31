"""
Question Generator Agent
Generates unique exam questions using RAG + Groq LLM.
Uses official exam patterns for JEE Main, JEE Advanced, and NEET.
"""

import json
import logging
import re
import hashlib
from typing import List, Dict, Optional
from app.services.groq_manager import groq_manager
from app.rag.pipeline import rag_pipeline
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)


def _repair_truncated_json(text: str) -> Optional[str]:
    """Attempt to repair JSON that was truncated mid-stream."""
    # Find the last complete object in a truncated array
    # Look for the last complete }, then close the array and wrapper
    last_complete = text.rfind("},")
    if last_complete == -1:
        last_complete = text.rfind("}")
    if last_complete == -1:
        return None

    truncated = text[:last_complete + 1]

    # Count unclosed brackets and braces
    open_brackets = truncated.count("[") - truncated.count("]")
    open_braces = truncated.count("{") - truncated.count("}")

    # Close them
    truncated += "]" * open_brackets
    truncated += "}" * open_braces

    return truncated


def _extract_questions_json(text: str) -> Optional[List[Dict]]:
    """Robustly extract a JSON array of questions from LLM output."""
    if not text:
        return None

    def _extract_list_from_parsed(parsed):
        if isinstance(parsed, dict):
            for key in ["questions", "data", "result"]:
                if key in parsed and isinstance(parsed[key], list):
                    return parsed[key]
            for v in parsed.values():
                if isinstance(v, list):
                    return v
        if isinstance(parsed, list):
            return parsed
        return None

    # Strategy 1: Direct parse
    try:
        parsed = json.loads(text)
        result = _extract_list_from_parsed(parsed)
        if result is not None:
            return result
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract JSON array from text
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 3: Extract JSON object containing array
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        parsed = json.loads(text[start:end])
        result = _extract_list_from_parsed(parsed)
        if result is not None:
            return result
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 4: Fix common JSON errors and retry
    try:
        fixed = re.sub(r',\s*([}\]])', r'\1', text)
        fixed = re.sub(r'(\{|,)\s*(\w+)\s*:', r'\1 "\2":', fixed)
        start = fixed.index("[")
        end = fixed.rindex("]") + 1
        return json.loads(fixed[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    # Strategy 5: Repair truncated JSON (response hit max_tokens)
    logger.warning("Attempting truncated JSON repair...")
    repaired = _repair_truncated_json(text)
    if repaired:
        try:
            parsed = json.loads(repaired)
            result = _extract_list_from_parsed(parsed)
            if result is not None:
                logger.info(f"Recovered {len(result)} questions from truncated response")
                return result
        except json.JSONDecodeError:
            pass

    logger.error(f"All JSON extraction strategies failed. Response preview: {text[:300]}")
    return None

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


# Maximum questions per API call to avoid token truncation
MAX_BATCH_SIZE = 5


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
    """Generate a batch of questions, splitting into sub-batches if needed."""

    if count <= MAX_BATCH_SIZE:
        return _generate_single_batch(
            exam_type=exam_type,
            subject=subject,
            question_type=question_type,
            count=count,
            chapters=chapters,
            difficulty=difficulty,
            section_label=section_label,
            marks_map=marks_map,
        )

    # Split large requests into smaller sub-batches
    all_questions = []
    remaining = count
    while remaining > 0:
        batch_size = min(remaining, MAX_BATCH_SIZE)
        batch = _generate_single_batch(
            exam_type=exam_type,
            subject=subject,
            question_type=question_type,
            count=batch_size,
            chapters=chapters,
            difficulty=difficulty,
            section_label=section_label,
            marks_map=marks_map,
        )
        all_questions.extend(batch)
        remaining -= batch_size
        if not batch:
            logger.warning(f"Sub-batch returned 0 questions, stopping early")
            break

    return all_questions[:count]


def _generate_single_batch(
    exam_type: str,
    subject: str,
    question_type: str,
    count: int,
    chapters: List[str],
    difficulty: str,
    section_label: str,
    marks_map: Dict,
) -> List[Dict]:
    """Generate a single small batch of questions (max MAX_BATCH_SIZE)."""

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
4. Provide a BRIEF 2-3 step solution (keep each step concise, 1-2 sentences max)
5. Include a SHORT concept explanation (1 sentence)
6. Questions must test problem-solving, not just recall

Return a JSON object with a "questions" key containing an array. Each question object:
{{
  "question": "question text",
  "questionType": "{question_type}",
  "options": [{{"id": "A", "text": "..."}}, ...] or [],
  "correctAnswer": "A" or ["A","C"] or 42.5,
  "difficulty": "easy|medium|hard",
  "subject": "{subject}",
  "chapter": "chapter name",
  "examType": "{exam_type}",
  "solutionSteps": [{{"step": 1, "content": "..."}}, {{"step": 2, "content": "..."}}],
  "conceptExplanation": "brief explanation",
  "tags": ["topic1", "topic2"]
}}

Return EXACTLY {count} questions in the JSON object."""

    response = groq_manager.chat_completion(
        messages=[
            {"role": "system", "content": "You are an expert exam question creator for JEE and NEET. Return ONLY valid JSON with a 'questions' key containing the array of questions. No markdown, no extra text."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.85,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )

    questions = []
    if response:
        parsed_list = _extract_questions_json(response)
        if parsed_list:
            for q in parsed_list:
                q_type = q.get("questionType", question_type)
                q["questionType"] = q_type
                q["marks"] = marks_map.get(q_type, {"correct": 4, "incorrect": -1, "partial": 0})
                q["isAIGenerated"] = True
                questions.append(q)
        else:
            logger.error(f"Failed to parse questions from AI response. Length: {len(response)}, ends with: ...{response[-100:]}")

    return questions[:count]
