"""
Groq API Multi-Key Manager
Supports up to 10 API keys with round-robin rotation and automatic retry on rate limits.
"""

import time
import logging
from typing import Optional, Dict, Any
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)


class GroqKeyManager:
    def __init__(self):
        self.keys = settings.groq_keys
        self.current_index = 0
        self.key_usage = {i: {"calls": 0, "errors": 0, "last_used": 0} for i in range(len(self.keys))}
        self.max_retries = len(self.keys) if self.keys else 1

        if not self.keys:
            logger.warning("⚠️ No Groq API keys configured. AI features will be limited.")

    def _get_current_key(self) -> Optional[str]:
        if not self.keys:
            return None
        return self.keys[self.current_index]

    def _rotate_key(self):
        """Round-robin key rotation"""
        if self.keys:
            self.current_index = (self.current_index + 1) % len(self.keys)
            logger.info(f"🔑 Rotated to Groq key {self.current_index + 1}/{len(self.keys)}")

    def get_client(self) -> Optional[Groq]:
        key = self._get_current_key()
        if not key:
            return None
        return Groq(api_key=key)

    def chat_completion(
        self,
        messages: list,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        response_format: Optional[Dict] = None,
    ) -> Optional[str]:
        """Make a chat completion with automatic key rotation on rate limit."""

        if not self.keys:
            logger.error("No Groq API keys available")
            return None

        model = model or settings.groq_generation_model

        for attempt in range(self.max_retries):
            key_index = self.current_index
            try:
                client = self.get_client()
                if not client:
                    return None

                kwargs: Dict[str, Any] = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if response_format:
                    kwargs["response_format"] = response_format

                response = client.chat.completions.create(**kwargs)

                # Track usage
                self.key_usage[key_index]["calls"] += 1
                self.key_usage[key_index]["last_used"] = time.time()

                # Rotate for next call
                self._rotate_key()

                return response.choices[0].message.content

            except Exception as e:
                error_str = str(e)
                self.key_usage[key_index]["errors"] += 1

                if "rate_limit" in error_str.lower() or "429" in error_str:
                    logger.warning(f"⚠️ Rate limit on key {key_index + 1}, rotating...")
                    self._rotate_key()
                    time.sleep(1)
                    continue
                else:
                    logger.error(f"Groq API error: {error_str}")
                    self._rotate_key()
                    if attempt < self.max_retries - 1:
                        continue
                    return None

        logger.error("All Groq API keys exhausted")
        return None

    def get_status(self) -> dict:
        return {
            "total_keys": len(self.keys),
            "current_key_index": self.current_index,
            "key_usage": self.key_usage,
        }


# Singleton instance
groq_manager = GroqKeyManager()
