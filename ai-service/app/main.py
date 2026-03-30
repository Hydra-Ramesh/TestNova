from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="../.env")

from app.routers import generate, explain, chatbot, embeddings

app = FastAPI(
    title="TestNova AI Service",
    description="AI-powered question generation, explanation, and tutoring for JEE/NEET",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api/generate", tags=["Generation"])
app.include_router(explain.router, prefix="/api/explain", tags=["Explanation"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(embeddings.router, prefix="/api/embeddings", tags=["Embeddings"])


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ai-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
