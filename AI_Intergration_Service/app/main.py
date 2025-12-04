from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.api.routes import chat, documents, health

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Trinity Shuttle AI Service",
    description="RAG-powered chatbot using LangChain + LangGraph for campus shuttle tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f" Starting {settings.SERVICE_NAME}")
    logger.info(f" Environment: {settings.ENVIRONMENT}")
    logger.info(f" Port: {settings.SERVICE_PORT}")
    logger.info(f" Chat Model: {settings.CHAT_MODEL}")
    logger.info(f" Embedding Model: {settings.EMBEDDING_MODEL}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info(" Shutting down AI service")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Trinity Shuttle AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.SERVICE_PORT,
        reload=settings.ENVIRONMENT == "development"
    )
