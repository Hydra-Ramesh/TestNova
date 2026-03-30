"""Redis cache service for AI responses."""

import json
import logging
from typing import Optional, Any
import redis
from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TTL = 6 * 60 * 60  # 6 hours

try:
    redis_client = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        decode_responses=True,
        socket_connect_timeout=3,
    )
    redis_client.ping()
    logger.info("🔴 Redis connected for AI cache")
except Exception:
    redis_client = None
    logger.warning("⚠️ Redis not available, AI cache disabled")


def cache_get(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    try:
        data = redis_client.get(f"ai:{key}")
        return json.loads(data) if data else None
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL):
    if not redis_client:
        return
    try:
        redis_client.setex(f"ai:{key}", ttl, json.dumps(value))
    except Exception:
        pass
