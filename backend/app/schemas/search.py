from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    document_id: UUID
    original_filename: Optional[str] = None
    page_number: int
    chunk_index: int
    text: str
    chunk_text: str
    similarity_score: float
    similarity: float
    page_width: Optional[float] = None
    page_height: Optional[float] = None
    bboxes: Optional[List[List[float]]] = None

    model_config = ConfigDict(from_attributes=True)


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]
