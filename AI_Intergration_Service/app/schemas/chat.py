from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=1000, description="User message")
    session_id: Optional[UUID] = Field(default_factory=uuid4, description="Session ID")
    user_id: Optional[UUID] = Field(None, description="User ID (optional)")
    include_sources: bool = Field(True, description="Include source documents")


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""
    response: str = Field(..., description="AI-generated response")
    session_id: UUID = Field(..., description="Session ID")
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="Source documents")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "response": "The shuttle operates from 7 AM to 11 PM on weekdays.",
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "sources": [{"category": "faq", "content": "Operating hours..."}],
                "timestamp": "2025-10-31T10:30:00"
            }
        }