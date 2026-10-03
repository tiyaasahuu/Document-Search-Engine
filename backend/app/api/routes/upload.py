from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUploadResponse
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
    current_user: User = Depends(get_current_user),
):
    document = DocumentService.save_uploaded_document(db, file, current_user)
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
    current_user: User = Depends(get_current_user),
):
    return DocumentService.get_all_documents(db, current_user)


@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
    summary="Get Document Metadata by ID",
    tags=["Documents"],
)
def get_document_by_id(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DocumentService.get_document_by_id(db, document_id, current_user)


@router.get(
    "/documents/{document_id}/file",
    summary="Stream Original Uploaded PDF File",
    tags=["Documents"],
)
def get_document_file(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_path, original_filename = DocumentService.get_document_file_path(db, document_id, current_user)
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=original_filename,
        headers={"Content-Disposition": f'inline; filename="{original_filename}"'},
    )


@router.get(
    "/documents/{document_id}/outline",
    summary="Get Document Bookmarks Outline",
    tags=["Documents"],
)
def get_document_outline(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DocumentService.get_document_outline(db, document_id, current_user)
