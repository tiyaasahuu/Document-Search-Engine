import os
import logging
from typing import List, Dict, Any
import pymupdf as fitz
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.services.ocr_service import OCRService
from app.services.chunking_service import ChunkingService

logger = logging.getLogger(__name__)



class PDFExtractionError(Exception):
    """Custom exception raised during PDF extraction failure."""
    pass


class PDFExtractorService:
    @staticmethod
    def is_text_sufficient(text: str) -> bool:
        """
        Determines whether PyMuPDF extracted text meets the minimum character threshold
        configured in settings.OCR_MIN_TEXT_CHARS.
        """
        cleaned = text.strip() if text else ""
        return len(cleaned) >= settings.OCR_MIN_TEXT_CHARS

    @classmethod
    def extract_page_data(cls, file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text, width, height, page_number (1-indexed), and extraction_method ("pymupdf", "ocr", or "ocr_failed")
        for each page of a PDF using PyMuPDF and OCR fallback when text is insufficient.
        """
        if not os.path.exists(file_path):
            raise PDFExtractionError(f"PDF file does not exist at path: {file_path}")

        extracted_pages = []
        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open PDF file {file_path}: {e}")
            raise PDFExtractionError(f"Invalid or corrupted PDF file: {e}")

        try:
            if doc.is_encrypted:
                logger.error(f"PDF file {file_path} is password protected/encrypted.")
                raise PDFExtractionError("PDF file is password protected/encrypted.")

            page_count = doc.page_count
            if page_count == 0:
                logger.error(f"PDF file {file_path} contains 0 pages.")
                raise PDFExtractionError("PDF file contains no pages.")

            for page_index in range(page_count):
                page = doc.load_page(page_index)
                rect = page.rect
                pymupdf_text = page.get_text() or ""

                if cls.is_text_sufficient(pymupdf_text):
                    final_text = pymupdf_text
                    method = "pymupdf"
                else:
                    logger.info(
                        f"Page {page_index + 1} has insufficient text ({len(pymupdf_text.strip())} chars < {settings.OCR_MIN_TEXT_CHARS}). Triggering OCR fallback."
                    )
                    ocr_text, ocr_method = OCRService.extract_text_from_page(page)
                    if ocr_method == "ocr" and ocr_text is not None:
                        final_text = ocr_text
                        method = "ocr"
                    else:
                        # OCR failed or unavailable: log error and track extraction_method as "ocr_failed"
                        logger.warning(
                            f"OCR fallback failed/unavailable for page {page_index + 1}. Retaining PyMuPDF text with method 'ocr_failed'."
                        )
                        final_text = pymupdf_text
                        method = "ocr_failed"

                extracted_pages.append(
                    {
                        "page_number": page_index + 1,
                        "text": final_text,
                        "width": float(rect.width),
                        "height": float(rect.height),
                        "extraction_method": method,
                    }
                )
            doc.close()
            return extracted_pages
        except PDFExtractionError:
            doc.close()
            raise
        except Exception as e:
            doc.close()
            logger.error(f"Error during PDF text extraction for {file_path}: {e}")
            raise PDFExtractionError(f"Failed to extract text from PDF: {e}")

    @classmethod
    def process_document_extraction(cls, db: Session, document: Document) -> bool:
        """
        Executes document text extraction and manages status transitions:
        Uploaded -> Processing -> Processed / Failed
        """
        # Step 1: Transition status to Processing
        try:
            document.status = "Processing"
            db.commit()
            db.refresh(document)
        except Exception as e:
            logger.error(f"Failed to set status to Processing for document {document.id}: {e}")
            db.rollback()

        file_path = document.file_path
        if not os.path.isabs(file_path):
            file_path = os.path.abspath(file_path)

        # Step 2: Extract text & store pages in PostgreSQL
        try:
            pages_data = cls.extract_page_data(file_path)

            # Clear existing pages if re-processing
            db.query(DocumentPage).filter(DocumentPage.document_id == document.id).delete()

            page_objects = [
                DocumentPage(
                    document_id=document.id,
                    page_number=page["page_number"],
                    text=page["text"],
                    width=page["width"],
                    height=page["height"],
                    extraction_method=page["extraction_method"],
                )
                for page in pages_data
            ]
            db.add_all(page_objects)

            document.status = "Processed"
            db.commit()
            db.refresh(document)
            logger.info(f"Successfully extracted {len(page_objects)} pages for document {document.id}.")

            # Step 3: Trigger text chunking service
            chunks = ChunkingService.process_document_chunking(db, document.id)
            logger.info(f"Successfully chunked document {document.id} into {len(chunks)} text chunks.")

            return True

        except Exception as e:
            db.rollback()
            logger.error(f"PDF extraction failed for document {document.id}: {e}")
            try:
                document.status = "Failed"
                db.commit()
                db.refresh(document)
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to update document {document.id} status to Failed: {commit_err}")
            return False
