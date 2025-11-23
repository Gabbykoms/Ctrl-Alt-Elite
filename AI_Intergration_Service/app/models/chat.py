from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.database import Base


class ChatHistory(Base):
    """Chat history model for conversation tracking"""

    __tablename__ = "chat_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    
    # FIX: Rename Python attribute to 'chat_metadata' to avoid SQLAlchemy reserved keyword
    # The string "metadata" ensures it still maps to the 'metadata' column in the DB
    chat_metadata = Column("metadata", JSONB, default={})
    
    timestamp = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ChatHistory {self.session_id} - {self.role}>"