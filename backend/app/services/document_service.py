import os
import uuid
from typing import List
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.pdf_extractor import PDFExtractorService


class DocumentService:
    @staticmethod
    def _ensure_upload_dir() -> str:
        upload_path = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(upload_path, exist_ok=True)
        return upload_path

    @classmethod
    def save_uploaded_document(cls, db: Session, file: UploadFile, current_user: User) -> Document:
        # Validate MIME type and file extension
        filename_lower = file.filename.lower() if file.filename else ""
        if not filename_lower.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are allowed.",
            )

        mime_type = file.content_type or "application/pdf"
        if mime_type != "application/pdf" and not filename_lower.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid MIME type. Only PDF files are allowed.",
            )

        # Check file size (50MB limit)
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB} MB.",
            )

        # Generate unique storage filename
        doc_id = uuid.uuid4()
        unique_filename = f"{doc_id}.pdf"
        upload_dir = cls._ensure_upload_dir()
        destination_path = os.path.join(upload_dir, unique_filename)
        relative_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

        # Save file to disk
        try:
            with open(destination_path, "wb") as buffer:
                while chunk := file.file.read(8192):
                    buffer.write(chunk)
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save uploaded file: {str(err)}",
            )

        # Save metadata to database with current_user ownership
        try:
            document = Document(
                id=doc_id,
                user_id=current_user.id,
                filename=unique_filename,
                original_filename=file.filename or unique_filename,
                file_size=file_size,
                mime_type="application/pdf",
                status="Uploaded",
                file_path=relative_path,
            )
            db.add(document)
            db.commit()
            db.refresh(document)
        except Exception as err:
            db.rollback()
            # Clean up saved file if DB transaction fails
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to record document metadata: {str(err)}",
            )

        # Trigger PDF text extraction service
        PDFExtractorService.process_document_extraction(db, document)
        return document

    @staticmethod
    def get_all_documents(db: Session, current_user: User) -> List[DocumentResponse]:
        """Returns all documents uploaded by the authenticated user."""
        stmt = (
            select(Document)
            .where(Document.user_id == current_user.id)
            .order_by(Document.upload_time.desc())
        )
        docs = list(db.scalars(stmt).all())
        res = []
        for d in docs:
            doc_res = DocumentResponse.model_validate(d)
            doc_res.total_pages = len(d.pages) if d.pages else 0
            res.append(doc_res)
        return res

    @staticmethod
    def get_document_by_id(db: Session, document_id: uuid.UUID, current_user: User) -> DocumentResponse:
        """Retrieves document by ID scoped to current user ownership."""
        stmt = select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
        doc = db.scalar(stmt)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        res = DocumentResponse.model_validate(doc)
        res.total_pages = len(doc.pages) if doc.pages else 0
        return res

    @classmethod
    def get_document_file_path(cls, db: Session, document_id: uuid.UUID, current_user: User) -> tuple[str, str]:
        """
        Retrieves safe absolute file path for an uploaded PDF.
        Validates document existence and user ownership.
        Returns tuple of (abs_path, original_filename).
        """
        stmt = select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
        doc = db.scalar(stmt)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        upload_dir = cls._ensure_upload_dir()

        # Prevent path traversal attacks
        safe_filename = os.path.basename(doc.filename)
        abs_file_path = os.path.abspath(os.path.join(upload_dir, safe_filename))

        if not abs_file_path.startswith(upload_dir):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document path.",
            )

        if not os.path.exists(abs_file_path) or not os.path.isfile(abs_file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document PDF file missing from storage.",
            )

        return abs_file_path, doc.original_filename

    @classmethod
    def get_document_outline(cls, db: Session, document_id: uuid.UUID, current_user: User) -> List[dict]:
        """
        Retrieves extracted Table of Contents / bookmarks for user-owned document.
        """
        file_path, _ = cls.get_document_file_path(db, document_id, current_user)
        return PDFExtractorService.extract_outline(file_path)
