from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.utils.auth import get_authenticated_db
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.embedding_service import EmbeddingService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=DocumentResponse)
async def create_document(
        document: DocumentCreate,
        db: Session = Depends(get_authenticated_db)
):
    """
    Create a new document with embedding
    Admin endpoint for adding knowledge base content
    """
    try:
        embedding_service = EmbeddingService(db)
        doc = embedding_service.create_document(
            content=document.content,
            category=document.category,
            metadata=document.metadata
        )
        return doc
    except Exception as e:
        logger.error(f"Error creating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
        category: str = None,
        limit: int = 10,
        db: Session = Depends(get_authenticated_db)
):
    """List documents with optional category filter"""
    try:
        from app.models.document import Document

        query = db.query(Document)
        if category:
            query = query.filter(Document.category == category)

        documents = query.limit(limit).all()
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(
        document_id: str,
        db: Session = Depends(get_authenticated_db)
):
    """Delete a document"""
    try:
        from app.models.document import Document
        from uuid import UUID

        doc = db.query(Document).filter(Document.id == UUID(document_id)).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        db.delete(doc)
        db.commit()

        return {"message": "Document deleted successfully", "id": document_id}
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))