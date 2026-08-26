from datetime import datetime
from uuid import UUID
from typing import List
from pydantic import BaseModel, ConfigDict
from app.schemas.document import DocumentResponse


class DocumentPageResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    text: str
    width: float
    height: float
    extraction_method: str = "pymupdf"
    created_at: datetime


    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    pages: List[DocumentPageResponse] = []
