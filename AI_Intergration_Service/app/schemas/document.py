from pydantic import BaseModel, Field, ConfigDict
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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: UUID
    content: str
    category: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict, alias='doc_metadata')
    created_at: datetime