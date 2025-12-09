from langchain_openai import OpenAIEmbeddings
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging

from app.models.document import Document
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and storing embeddings"""

    def __init__(self, db: Session):
        self.db = db
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.VECTOR_DIMENSION,
            api_key=settings.OPENAI_API_KEY
        )

    def create_document(
            self,
            content: str,
            category: Optional[str] = None,
            metadata: Optional[Dict[str, Any]] = None
    ) -> Document:
        """
        Create document with embedding

        Args:
            content: Document text content
            category: Document category
            metadata: Additional metadata

        Returns:
            Created document with embedding
        """
        try:
            # Generate embedding
            embedding = self.embeddings.embed_query(content)

            # Create document
            document = Document(
                content=content,
                category=category,
                metadata=metadata or {},
                embedding=embedding
            )

            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)

            logger.info(f"Created document: {document.id}")
            return document

        except Exception as e:
            logger.error(f"Error creating document: {e}")
            self.db.rollback()
            raise