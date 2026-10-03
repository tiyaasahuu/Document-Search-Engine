from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.rag import RAGSourceItem


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    sources: Optional[List[RAGSourceItem]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = Field("New Conversation", max_length=255)
    document_id: Optional[UUID] = Field(None, description="Optional document UUID filter for this conversation")


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    document_id: Optional[UUID] = Field(None, description="Optional document UUID filter")


class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    document_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []


class ChatStreamRequest(BaseModel):
    message: str = Field(..., description="User's chat input message")
    conversation_id: Optional[UUID] = Field(None, description="Optional existing conversation ID. If null, a new conversation is created.")
    document_id: Optional[UUID] = Field(None, description="Optional document UUID filter override")
    limit: int = Field(5, ge=1, le=20, description="Max document chunks to retrieve for RAG context")
