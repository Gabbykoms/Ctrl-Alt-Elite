from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class DocumentCreate(BaseModel):
    """Schema for creating a document"""
    content: str = Field(..., min_length=10, description="Document content")
    category: Optional[str] = Field(None, description="Document category")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DocumentResponse(BaseModel):
    """Schema for document response"""
    id: UUID
    content: str
    category: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True