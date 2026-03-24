from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from uuid import uuid4

from app.database import get_db
from app.utils.auth import get_authenticated_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatQueueResponse, ChatStatusResponse
from app.services.rag_service import ShuttleRAGService
from app.models.chat import ChatRequest as ChatRequestModel

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ChatQueueResponse)
async def chat(
        request: ChatRequest,
        db: Session = Depends(get_authenticated_db)
):
    """
    Submit chat request to processing queue
    
    - **message**: User's question about shuttle service
    - **session_id**: Conversation session (auto-generated if not provided)
    - **user_id**: Optional user identifier
    - **include_sources**: Whether to include source documents in response
    
    Returns immediately with request_id for polling
    """
    try:
        # Import here to avoid circular dependency
        from app.main import rabbitmq_chat_service
        
        if not rabbitmq_chat_service or not rabbitmq_chat_service.is_connected:
            raise HTTPException(
                status_code=503,
                detail="Chat service temporarily unavailable. RabbitMQ not connected."
            )
        
        # Generate unique request ID
        request_id = str(uuid4())
        
        # Create database record
        chat_request_record = ChatRequestModel(
            request_id=request_id,
            session_id=request.session_id,
            user_id=request.user_id,
            message=request.message,
            status='queued'
        )
        db.add(chat_request_record)
        db.commit()
        
        # Publish to RabbitMQ queue
        await rabbitmq_chat_service.publish_chat_request(
            request_id=request_id,
            message=request.message,
            session_id=str(request.session_id),
            user_id=str(request.user_id) if request.user_id else None,
            include_sources=request.include_sources
        )
        
        logger.info(f"Queued chat request: {request_id}")
        
        return ChatQueueResponse(
            request_id=request_id,
            status="queued",
            message="Your request is being processed"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat queue error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error queueing chat request: {str(e)}")


@router.get("/response/{request_id}", response_model=ChatStatusResponse)
async def get_chat_response(
        request_id: str,
        db: Session = Depends(get_authenticated_db)
):
    """
    Poll for chat response by request ID
    
    - **request_id**: Unique request tracking ID returned from POST /chat/
    
    Returns current status and response (if completed)
    """
    try:
        chat_request = db.query(ChatRequestModel).filter_by(request_id=request_id).first()
        
        if not chat_request:
            raise HTTPException(status_code=404, detail=f"Request not found: {request_id}")
        
        return ChatStatusResponse(
            request_id=chat_request.request_id,
            status=chat_request.status,
            response=chat_request.response,
            sources=chat_request.sources,
            error_message=chat_request.error_message,
            created_at=chat_request.created_at,
            completed_at=chat_request.completed_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_chat_history(
        session_id: str,
        limit: int = 50,
        db: Session = Depends(get_authenticated_db)
):
    """Get chat history for a session"""
    try:
        from app.models.chat import ChatHistory
        from sqlalchemy import desc

        history = db.query(ChatHistory) \
            .filter(ChatHistory.session_id == session_id) \
            .order_by(desc(ChatHistory.timestamp)) \
            .limit(limit) \
            .all()

        return {
            "session_id": session_id,
            "message_count": len(history),
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                }
                for msg in reversed(history)
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))