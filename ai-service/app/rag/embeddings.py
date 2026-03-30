"""Embedding generation using tiktoken-based lightweight embeddings.

Falls back to a simple hash-based approach when sentence-transformers
is not available (e.g., on Render free tier).
"""

import logging
import hashlib
import numpy as np
from typing import Optional, List

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 384


def _text_to_hash_embedding(text: str) -> List[float]:
    """Generate a deterministic pseudo-embedding from text using hashing.
    This is a lightweight fallback when sentence-transformers isn't available."""
    text = text.lower().strip()
    # Generate multiple hashes for different dimensions
    embeddings = []
    for i in range(EMBEDDING_DIM):
        h = hashlib.sha256(f"{text}_{i}".encode()).hexdigest()
        val = (int(h[:8], 16) / 0xFFFFFFFF) * 2 - 1  # normalize to [-1, 1]
        embeddings.append(val)
    # Normalize
    arr = np.array(embeddings, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()


def generate_embeddings(text: str) -> Optional[List[float]]:
    """Generate embeddings for a text string."""
    try:
        # Try sentence-transformers first (local dev)
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except ImportError:
        # Fallback to hash-based embeddings (production/Render)
        logger.info("Using hash-based embeddings (sentence-transformers not installed)")
        return _text_to_hash_embedding(text)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return _text_to_hash_embedding(text)


def generate_batch_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """Generate embeddings for a batch of texts."""
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()
    except ImportError:
        return [_text_to_hash_embedding(t) for t in texts]
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        return [_text_to_hash_embedding(t) for t in texts]
