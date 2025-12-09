from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from app.database import get_db
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@router.get("/db")
async def database_health(db: Session = Depends(get_db)):
    """Database connection health check"""
    try:
        db.execute(text("SELECT 1"))

        # Check for pgvector
        result = db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'"))
        has_pgvector = result.fetchone() is not None

        return {
            "status": "healthy",
            "database": "connected",
            "pgvector": "enabled" if has_pgvector else "not found"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": str(e)
        }


@router.get("/openai")
async def openai_health():
    """OpenAI API health check"""
    try:
        from langchain_openai import OpenAIEmbeddings

        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.AI_OPENAI_API_KEY
        )

        # Simple test embedding
        test_embedding = embeddings.embed_query("test")

        return {
            "status": "healthy",
            "openai": "connected",
            "embedding_dimension": len(test_embedding),
            "model": settings.EMBEDDING_MODEL
        }
    except Exception as e:
        logger.error(f"OpenAI health check failed: {e}")
        return {
            "status": "unhealthy",
            "openai": str(e)
        }