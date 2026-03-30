"""Vector DB retriever using Qdrant Cloud."""

import logging
from typing import List, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "testnova_knowledge"


class VectorRetriever:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import Distance, VectorParams

            if not settings.qdrant_url:
                logger.warning("⚠️ QDRANT_URL not set. Vector search disabled.")
                return

            self.client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key if settings.qdrant_api_key else None,
                timeout=10,
            )

            # Create collection if not exists
            collections = self.client.get_collections().collections
            exists = any(c.name == COLLECTION_NAME for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
                logger.info(f"✅ Created Qdrant collection: {COLLECTION_NAME}")

            # Ensure payload indexes exist for filtering
            from qdrant_client.models import PayloadSchemaType
            for field in ["subject", "exam_type", "chapter"]:
                try:
                    self.client.create_payload_index(
                        collection_name=COLLECTION_NAME,
                        field_name=field,
                        field_schema=PayloadSchemaType.KEYWORD,
                    )
                except Exception:
                    pass  # Index already exists
            logger.info(f"✅ Qdrant Cloud connected — collection: {COLLECTION_NAME}")

        except Exception as e:
            logger.warning(f"⚠️ Qdrant not available: {e}. Vector search disabled.")
            self.client = None

    def search(
        self,
        query: str,
        subject: Optional[str] = None,
        exam_type: Optional[str] = None,
        top_k: int = 5,
    ) -> List[Dict]:
        """Search vector DB for relevant documents."""
        if not self.client:
            return []

        try:
            from app.rag.embeddings import generate_embeddings
            from qdrant_client.models import Filter, FieldCondition, MatchValue

            query_embedding = generate_embeddings(query)
            if query_embedding is None:
                return []

            # Build filter
            conditions = []
            if subject:
                conditions.append(
                    FieldCondition(key="subject", match=MatchValue(value=subject))
                )
            if exam_type:
                conditions.append(
                    FieldCondition(key="exam_type", match=MatchValue(value=exam_type))
                )

            search_filter = Filter(must=conditions) if conditions else None

            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=top_k,
            )

            return [
                {
                    "text": point.payload.get("text", ""),
                    "subject": point.payload.get("subject", ""),
                    "chapter": point.payload.get("chapter", ""),
                    "score": point.score,
                }
                for point in results
            ]

        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    def upsert(
        self,
        doc_id: str,
        text: str,
        embedding: List[float],
        metadata: Dict,
    ) -> bool:
        """Insert or update a document in the vector DB."""
        if not self.client:
            return False

        try:
            from qdrant_client.models import PointStruct
            import hashlib

            point_id = int(hashlib.md5(doc_id.encode()).hexdigest()[:15], 16)

            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={"text": text, **metadata},
                    )
                ],
            )
            return True

        except Exception as e:
            logger.error(f"Vector upsert failed: {e}")
            return False


# Singleton
vector_retriever = VectorRetriever()
