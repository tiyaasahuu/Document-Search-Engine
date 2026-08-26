from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.document import DocumentUploadResponse, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter()


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF Document",
    tags=["Documents"],
)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    document = DocumentService.save_uploaded_document(db, file)
    return DocumentUploadResponse(
        success=True,
        document_id=document.id,
        filename=document.original_filename,
        status=document.status,
    )


@router.get(
    "/documents",
    response_model=List[DocumentResponse],
    summary="Get All Uploaded Documents",
    tags=["Documents"],
)
def list_documents(
    db: Session = Depends(get_db),
):
    return DocumentService.get_all_documents(db)
