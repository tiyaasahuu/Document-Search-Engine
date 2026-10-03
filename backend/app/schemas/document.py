from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class DocumentUploadResponse(BaseModel):
    success: bool = True
    document_id: UUID
    filename: str
    status: str


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    upload_time: datetime
    status: str
    file_path: str
    total_pages: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

