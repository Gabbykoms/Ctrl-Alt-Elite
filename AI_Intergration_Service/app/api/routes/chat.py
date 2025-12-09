from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import ShuttleRAGService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ChatResponse)
async def chat(
        request: ChatRequest,
        db: Session = Depends(get_db)
):
    """
    Chat endpoint using LangChain + LangGraph RAG

    - **message**: User's question about shuttle service
    - **session_id**: Conversation session (auto-generated if not provided)
    - **user_id**: Optional user identifier
    - **include_sources**: Whether to include source documents in response
    """
    try:
        rag_service = ShuttleRAGService(db)

        result = await rag_service.process_query(
            user_query=request.message,
            session_id=str(request.session_id),
            user_id=str(request.user_id) if request.user_id else None
        )

        return ChatResponse(
            response=result["response"],
            session_id=request.session_id,
            sources=result["sources"] if request.include_sources else None
        )

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.get("/history/{session_id}")
async def get_chat_history(
        session_id: str,
        limit: int = 50,
        db: Session = Depends(get_db)
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