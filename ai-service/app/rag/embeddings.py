"""Embedding generation using sentence-transformers."""

import logging
import numpy as np
from typing import Optional, List

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("✅ Embedding model loaded: all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
    return _model


def generate_embeddings(text: str) -> Optional[List[float]]:
    """Generate embeddings for a text string."""
    model = _get_model()
    if model is None:
        return None
    try:
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


def generate_batch_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """Generate embeddings for a batch of texts."""
    model = _get_model()
    if model is None:
        return None
    try:
        embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        return None
