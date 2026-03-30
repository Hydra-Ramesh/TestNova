"""
RAG Pipeline
Retrieval-Augmented Generation for syllabus-accurate question generation.
"""

import logging
from typing import List, Dict, Optional
from app.rag.retriever import vector_retriever

logger = logging.getLogger(__name__)


class RAGPipeline:
    def __init__(self):
        self.retriever = vector_retriever

    def retrieve_context(
        self,
        query: str,
        subject: Optional[str] = None,
        exam_type: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict]:
        """Retrieve relevant syllabus chunks from vector DB."""
        try:
            results = self.retriever.search(
                query=query,
                subject=subject,
                exam_type=exam_type,
                top_k=top_k,
            )
            return results
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")
            return []

    def process_document(
        self,
        document_id: str,
        content: str,
        subject: str,
        chapter: str,
        exam_type: str,
    ) -> bool:
        """Process and store a document in the vector DB."""
        try:
            from app.rag.chunker import chunk_document
            from app.rag.embeddings import generate_embeddings

            chunks = chunk_document(content, chunk_size=500, overlap=50)

            for i, chunk in enumerate(chunks):
                embedding = generate_embeddings(chunk)
                if embedding is not None:
                    self.retriever.upsert(
                        doc_id=f"{document_id}_{i}",
                        text=chunk,
                        embedding=embedding,
                        metadata={
                            "subject": subject,
                            "chapter": chapter,
                            "exam_type": exam_type,
                            "document_id": document_id,
                            "chunk_index": i,
                        },
                    )

            logger.info(f"✅ Processed document {document_id}: {len(chunks)} chunks")
            return True

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            return False


# Singleton
rag_pipeline = RAGPipeline()
