from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    document_id: UUID
    page_number: int
    chunk_index: int
    text: str
    chunk_text: str
    similarity_score: float
    similarity: float

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]
