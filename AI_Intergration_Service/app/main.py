from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio
from typing import Optional

from app.config import settings
from app.api.routes import chat, documents, health
from app.services.rabbitmq_chat_service import RabbitMQChatService

# Configure logging
logging.basicConfig(
    level=settings.AI_LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Global RabbitMQ chat service instance
rabbitmq_chat_service: Optional[RabbitMQChatService] = None

# Create FastAPI app
app = FastAPI(
    title="Trinity Shuttle AI Service",
    description="RAG-powered chatbot using LangChain + LangGraph for campus shuttle tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    root_path="/api/ai"
)

# CORS middleware — use explicit origins from settings (AI_ALLOWED_ORIGINS env var)
# Never combine allow_origins=["*"] with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
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
    global rabbitmq_chat_service

    # Ensure rabbitmq_chat_service starts as None so the app is always
    # in a known state even if the block below raises unexpectedly.
    rabbitmq_chat_service = None

    logger.info(f" Starting {settings.AI_SERVICE_NAME}")
    logger.info(f" Environment: {settings.AI_ENVIRONMENT}")
    logger.info(f" Port: {settings.AI_SERVICE_PORT}")
    logger.info(f" Chat Model: {settings.CHAT_MODEL}")
    logger.info(f" Embedding Model: {settings.EMBEDDING_MODEL}")

    # Initialize RabbitMQ chat service.
    # A failure here must never prevent the app from starting — chat
    # endpoints will return 503 until RabbitMQ becomes available.
    try:
        logger.info("📡 Initializing RabbitMQ chat service...")
        service = RabbitMQChatService()
        await service.connect()

        # Start consumers in background only after a successful connect.
        asyncio.create_task(service.start_consumers())
        rabbitmq_chat_service = service
        logger.info("✅ RabbitMQ chat service initialized and consumers started")

    except Exception as e:
        logger.error(f"❌ Failed to initialize RabbitMQ chat service: {e}")
        logger.warning(
            "⚠️  Service starting without RabbitMQ — chat endpoints will "
            "return 503 until RabbitMQ is available"
        )
        rabbitmq_chat_service = None


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    global rabbitmq_chat_service
    
    # Close RabbitMQ connection
    if rabbitmq_chat_service:
        try:
            logger.info("Closing RabbitMQ connection...")
            await rabbitmq_chat_service.close()
            logger.info("✅ RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {e}")
    
    logger.info(" Shutting down AI service")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Trinity Shuttle AI Service",
        "version": "1.0.0",
        "status": "running",
        "rabbitmq_connected": rabbitmq_chat_service.is_connected if rabbitmq_chat_service else False,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=settings.AI_ENVIRONMENT == "development"
    )
