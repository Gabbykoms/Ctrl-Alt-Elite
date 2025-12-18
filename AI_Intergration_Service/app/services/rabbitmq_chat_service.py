"""
RabbitMQ Service for Chat Request Queue Processing
Handles asynchronous chat request processing with database persistence
"""
import asyncio
import json
import logging
from typing import Optional
from datetime import datetime
from uuid import uuid4

import aio_pika
from aio_pika import Connection, Channel, Queue, IncomingMessage, Message
from aio_pika.abc import AbstractRobustConnection
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal

logger = logging.getLogger(__name__)


class RabbitMQChatService:
    """
    RabbitMQ service for asynchronous chat request processing
    Publishes requests to queue and consumes them for processing
    """
    
    def __init__(self):
        self.connection: Optional[AbstractRobustConnection] = None
        self.channel: Optional[Channel] = None
        self._is_connected = False
        
    async def connect(self) -> None:
        """
        Establish connection to RabbitMQ server
        Uses robust connection for automatic reconnection
        """
        try:
            connection_url = (
                f"amqp://{settings.RABBITMQ_USER}:{settings.RABBITMQ_PASSWORD}"
                f"@{settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}/{settings.RABBITMQ_VHOST}"
            )
            
            logger.info(f"Connecting to RabbitMQ at {settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}")
            
            self.connection = await aio_pika.connect_robust(
                connection_url,
                timeout=10,
                reconnect_interval=5
            )
            
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)
            
            self._is_connected = True
            logger.info("✅ Successfully connected to RabbitMQ")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to RabbitMQ: {e}")
            self._is_connected = False
            raise
    
    async def close(self) -> None:
        """Gracefully close RabbitMQ connection"""
        try:
            if self.channel:
                await self.channel.close()
            if self.connection:
                await self.connection.close()
            
            self._is_connected = False
            logger.info("RabbitMQ connection closed")
            
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {e}")
    
    async def publish_chat_request(
        self,
        request_id: str,
        message: str,
        session_id: str,
        user_id: Optional[str] = None,
        include_sources: bool = True
    ) -> None:
        """
        Publish a chat request to the queue
        
        Args:
            request_id: Unique request identifier
            message: User's chat message
            session_id: Chat session ID
            user_id: Optional user ID
            include_sources: Whether to include sources in response
        """
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            payload = {
                "request_id": request_id,
                "message": message,
                "session_id": session_id,
                "user_id": user_id,
                "include_sources": include_sources,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            await self.channel.default_exchange.publish(
                Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type='application/json'
                ),
                routing_key=settings.RABBITMQ_CHAT_REQUESTS_QUEUE
            )
            
            logger.info(f"📤 Published chat request: {request_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish chat request: {e}")
            raise
    
    async def consume_chat_requests(self) -> None:
        """
        Consumer for chat requests
        Processes requests with RAG service and stores results in database
        """
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            # Declare queue (idempotent)
            queue: Queue = await self.channel.declare_queue(
                settings.RABBITMQ_CHAT_REQUESTS_QUEUE,
                durable=True,
                arguments={
                    "x-message-ttl": 300000,  # 5 minutes TTL
                    "x-max-length": 1000  # Max 1000 messages in queue
                }
            )
            
            logger.info(f"📡 Started consuming from queue: {settings.RABBITMQ_CHAT_REQUESTS_QUEUE}")
            
            # Start consuming messages
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process(requeue=True):
                        try:
                            await self._process_chat_request(message)
                        except Exception as e:
                            logger.error(f"Error processing chat request: {e}", exc_info=True)
                            # Message will be requeued due to requeue=True
                            
        except asyncio.CancelledError:
            logger.info("Chat requests consumer cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in chat requests consumer: {e}", exc_info=True)
            raise
    
    async def _process_chat_request(self, message: IncomingMessage) -> None:
        """
        Process individual chat request message
        Expected message format:
        {
            "request_id": "abc-123",
            "message": "Where is shuttle 001?",
            "session_id": "uuid",
            "user_id": "uuid" | null,
            "include_sources": true
        }
        """
        db: Session = SessionLocal()
        
        try:
            data = json.loads(message.body.decode())
            request_id = data.get("request_id")
            
            if not request_id:
                logger.warning("Received chat request without request_id")
                return
            
            logger.info(f"🔄 Processing chat request: {request_id}")
            
            # Import models here to avoid circular imports
            from app.models.chat import ChatRequest as ChatRequestModel
            from app.services.rag_service import ShuttleRAGService
            
            # Update status to processing
            chat_request = db.query(ChatRequestModel).filter_by(request_id=request_id).first()
            
            if not chat_request:
                logger.warning(f"Chat request not found in database: {request_id}")
                return
            
            chat_request.status = 'processing'
            chat_request.started_at = datetime.utcnow()
            db.commit()
            
            # Process with RAG service
            rag_service = ShuttleRAGService(db)
            result = await rag_service.process_query(
                user_query=data.get("message"),
                session_id=data.get("session_id"),
                user_id=data.get("user_id")
            )
            
            # Update with response
            chat_request.status = 'completed'
            chat_request.response = result.get("response")
            chat_request.sources = result.get("sources") if data.get("include_sources") else None
            chat_request.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"✅ Completed chat request: {request_id}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in chat request: {e}")
        except Exception as e:
            logger.error(f"Error processing chat request: {e}", exc_info=True)
            
            # Update status to failed
            try:
                from app.models.chat import ChatRequest as ChatRequestModel
                request_id = data.get("request_id") if 'data' in locals() else None
                
                if request_id:
                    chat_request = db.query(ChatRequestModel).filter_by(request_id=request_id).first()
                    if chat_request:
                        chat_request.status = 'failed'
                        chat_request.error_message = str(e)
                        chat_request.completed_at = datetime.utcnow()
                        db.commit()
            except Exception as inner_e:
                logger.error(f"Failed to update error status: {inner_e}")
        
        finally:
            db.close()
    
    async def start_consumers(self) -> None:
        """
        Start all background consumers
        Creates tasks that run concurrently
        """
        if not self._is_connected:
            raise RuntimeError("Not connected to RabbitMQ. Call connect() first.")
        
        logger.info("🚀 Starting RabbitMQ chat consumers...")
        
        # Create consumer task
        try:
            await self.consume_chat_requests()
        except asyncio.CancelledError:
            logger.info("Consumer tasks cancelled")
            raise
    
    @property
    def is_connected(self) -> bool:
        """Check if service is connected to RabbitMQ"""
        return self._is_connected
