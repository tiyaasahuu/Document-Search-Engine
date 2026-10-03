from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class RAGRequest(BaseModel):
    question: str = Field(..., description="User's question or query to be answered using document context")
    limit: int = Field(5, description="Maximum number of relevant chunks to retrieve for context", ge=1, le=20)
    document_id: Optional[UUID] = Field(None, description="Optional document UUID to filter retrieval")


class RAGSourceItem(BaseModel):
    document_id: UUID
    original_filename: Optional[str] = None
    page_number: int
    chunk_index: int
    text: str
    similarity_score: float
    page_width: Optional[float] = None
    page_height: Optional[float] = None
    bboxes: Optional[List[List[float]]] = None

    model_config = ConfigDict(from_attributes=True)


class RAGResponse(BaseModel):
    question: str
    answer: str
    sources: List[RAGSourceItem]
