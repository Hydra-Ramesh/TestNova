from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Groq Keys
    groq_keys: List[str] = []
    groq_generation_model: str = "llama-3.3-70b-versatile"
    groq_chat_model: str = "llama-3.1-8b-instant"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    class Config:
        env_file = "../.env"
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Load Groq keys from env
        keys = []
        for i in range(1, 11):
            key = os.getenv(f"GROQ_KEY_{i}", "")
            if key and key.startswith("gsk_"):
                keys.append(key)
        if keys:
            self.groq_keys = keys


settings = Settings()
