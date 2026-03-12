"""
RabbitMQ Service for consuming shuttle updates and alerts
Provides async consumers for real-time shuttle data integration into RAG context
"""
import asyncio
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

import aio_pika
from aio_pika import Connection, Channel, Queue, IncomingMessage
from aio_pika.abc import AbstractRobustConnection

from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQService:
    """
    RabbitMQ service for consuming shuttle-related messages
    Implements async consumers for shuttle updates and alerts
    """
    
    def __init__(self):
        self.connection: Optional[AbstractRobustConnection] = None
        self.channel: Optional[Channel] = None
        self.shuttle_updates_cache: Dict[str, Any] = {}
        self.shuttle_alerts_cache: list = []
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
    
    async def consume_shuttle_updates(self) -> None:
        """
        Consumer for shuttle location and status updates
        Stores updates in cache for RAG context injection
        """
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            # Declare queue (idempotent)
            queue: Queue = await self.channel.declare_queue(
                settings.RABBITMQ_SHUTTLE_UPDATES_QUEUE,
                durable=True,
                arguments={"x-message-ttl": 300000}  # 5 minutes TTL
            )
            
            logger.info(f"📡 Started consuming from queue: {settings.RABBITMQ_SHUTTLE_UPDATES_QUEUE}")
            
            # Start consuming messages
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process(requeue=True):
                        try:
                            await self._process_shuttle_update(message)
                        except Exception as e:
                            logger.error(f"Error processing shuttle update: {e}", exc_info=True)
                            # Message will be requeued due to requeue=True
                            
        except asyncio.CancelledError:
            logger.info("Shuttle updates consumer cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in shuttle updates consumer: {e}", exc_info=True)
            raise
    
    async def consume_shuttle_alerts(self) -> None:
        """
        Consumer for shuttle alerts and notifications
        Stores alerts in cache for RAG context
        """
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            # Declare queue (idempotent)
            queue: Queue = await self.channel.declare_queue(
                settings.RABBITMQ_SHUTTLE_ALERTS_QUEUE,
                durable=True,
                arguments={"x-message-ttl": 3600000}  # 1 hour TTL
            )
            
            logger.info(f"🔔 Started consuming from queue: {settings.RABBITMQ_SHUTTLE_ALERTS_QUEUE}")
            
            # Start consuming messages
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process(requeue=False):
                        try:
                            await self._process_shuttle_alert(message)
                        except Exception as e:
                            logger.error(f"Error processing shuttle alert: {e}", exc_info=True)
                            
        except asyncio.CancelledError:
            logger.info("Shuttle alerts consumer cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in shuttle alerts consumer: {e}", exc_info=True)
            raise
    
    async def _process_shuttle_update(self, message: IncomingMessage) -> None:
        """
        Process individual shuttle update message
        Expected message format:
        {
            "shuttle_id": "123",
            "location": {"lat": 41.5, "lng": -72.7},
            "status": "active",
            "route_id": "456",
            "timestamp": "2025-12-16T10:30:00Z"
        }
        """
        try:
            data = json.loads(message.body.decode())
            shuttle_id = data.get("shuttle_id")
            
            if not shuttle_id:
                logger.warning("Received shuttle update without shuttle_id")
                return
            
            # Update cache with latest shuttle data
            self.shuttle_updates_cache[shuttle_id] = {
                "location": data.get("location"),
                "status": data.get("status"),
                "route_id": data.get("route_id"),
                "timestamp": data.get("timestamp"),
                "speed": data.get("speed"),
                "heading": data.get("heading"),
                "received_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ Updated cache for shuttle {shuttle_id}: {data.get('status')} at {data.get('location')}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in shuttle update: {e}")
        except Exception as e:
            logger.error(f"Error processing shuttle update: {e}", exc_info=True)
    
    async def _process_shuttle_alert(self, message: IncomingMessage) -> None:
        """
        Process individual shuttle alert message
        Expected message format:
        {
            "alert_id": "alert-123",
            "type": "delay|cancelled|detour",
            "shuttle_id": "123",
            "route_id": "456",
            "message": "Shuttle delayed by 10 minutes",
            "severity": "low|medium|high",
            "timestamp": "2025-12-16T10:30:00Z"
        }
        """
        try:
            data = json.loads(message.body.decode())
            alert_id = data.get("alert_id")
            
            if not alert_id:
                logger.warning("Received alert without alert_id")
                return
            
            # Add alert to cache (keep last 50 alerts)
            alert_data = {
                "alert_id": alert_id,
                "type": data.get("type"),
                "shuttle_id": data.get("shuttle_id"),
                "route_id": data.get("route_id"),
                "message": data.get("message"),
                "severity": data.get("severity"),
                "timestamp": data.get("timestamp"),
                "received_at": datetime.utcnow().isoformat()
            }
            
            self.shuttle_alerts_cache.append(alert_data)
            
            # Keep only last 50 alerts
            if len(self.shuttle_alerts_cache) > 50:
                self.shuttle_alerts_cache = self.shuttle_alerts_cache[-50:]
            
            logger.info(f"🔔 New alert: {data.get('type')} - {data.get('message')}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in shuttle alert: {e}")
        except Exception as e:
            logger.error(f"Error processing shuttle alert: {e}", exc_info=True)
    
    async def start_consumers(self) -> None:
        """
        Start all background consumers
        Creates tasks that run concurrently
        """
        if not self._is_connected:
            raise RuntimeError("Not connected to RabbitMQ. Call connect() first.")
        
        logger.info("🚀 Starting RabbitMQ consumers...")
        
        # Create consumer tasks
        tasks = [
            asyncio.create_task(self.consume_shuttle_updates()),
            asyncio.create_task(self.consume_shuttle_alerts())
        ]
        
        try:
            # Wait for all consumers (they run indefinitely)
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            logger.info("Consumer tasks cancelled")
            for task in tasks:
                task.cancel()
            raise
    
    def get_shuttle_updates(self) -> Dict[str, Any]:
        """Get cached shuttle updates for RAG context"""
        return self.shuttle_updates_cache.copy()
    
    def get_shuttle_alerts(self) -> list:
        """Get cached shuttle alerts for RAG context"""
        return self.shuttle_alerts_cache.copy()
    
    def get_shuttle_by_id(self, shuttle_id: str) -> Optional[Dict[str, Any]]:
        """Get specific shuttle data by ID"""
        return self.shuttle_updates_cache.get(shuttle_id)
    
    @property
    def is_connected(self) -> bool:
        """Check if service is connected to RabbitMQ"""
        return self._is_connected
