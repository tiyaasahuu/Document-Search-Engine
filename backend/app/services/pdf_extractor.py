import os
import logging
from typing import List, Dict, Any
import pymupdf
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.services.ocr_service import OCRService
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService

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
        Extracts text, width, height, page_number (1-indexed), extraction_method ("pymupdf", "ocr", or "ocr_failed"),
        and blocks_data (with bounding box coordinates [x0, y0, x1, y1]) for each page of a PDF.
        """
        if not os.path.exists(file_path):
            raise PDFExtractionError(f"PDF file does not exist at path: {file_path}")

        extracted_pages = []
        try:
            doc = pymupdf.open(file_path)
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

                blocks_data: List[Dict[str, Any]] = []
                raw_blocks = page.get_text("blocks")
                for b in raw_blocks:
                    if len(b) >= 7 and b[6] == 0:  # text block
                        b_text = b[4].strip() if b[4] else ""
                        if b_text:
                            blocks_data.append({
                                "text": b_text,
                                "bbox": [round(float(b[0]), 2), round(float(b[1]), 2), round(float(b[2]), 2), round(float(b[3]), 2)]
                            })

                if cls.is_text_sufficient(pymupdf_text):
                    final_text = pymupdf_text
                    method = "pymupdf"
                else:
                    logger.info(
                        f"Page {page_index + 1} has insufficient text ({len(pymupdf_text.strip())} chars < {settings.OCR_MIN_TEXT_CHARS}). Triggering OCR fallback."
                    )
                    ocr_res = OCRService.extract_text_from_page(page, return_blocks=True)
                    ocr_text = ocr_res[0] if len(ocr_res) > 0 else None
                    ocr_method = ocr_res[1] if len(ocr_res) > 1 else "ocr_failed"
                    ocr_blocks = ocr_res[2] if len(ocr_res) > 2 else []

                    if ocr_method == "ocr" and ocr_text is not None:
                        final_text = ocr_text
                        method = "ocr"
                        if ocr_blocks:
                            blocks_data = ocr_blocks
                    else:
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
                        "blocks_data": blocks_data,
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
    def extract_outline(cls, file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts Table of Contents / bookmarks hierarchy from PDF using PyMuPDF doc.get_toc().
        """
        if not os.path.exists(file_path):
            return []
        try:
            doc = pymupdf.open(file_path)
            toc = doc.get_toc()
            doc.close()
            return [
                {
                    "level": int(item[0]),
                    "title": str(item[1]),
                    "page_number": int(item[2]),
                }
                for item in toc
                if len(item) >= 3 and item[2] > 0
            ]
        except Exception as e:
            logger.error(f"Failed to extract TOC from {file_path}: {e}")
            return []

    @classmethod
    def process_document_extraction(cls, db: Session, document: Document) -> bool:
        """
        Executes document text extraction and manages status transitions:
        Uploaded -> Processing -> Processed / Failed
        """
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

        try:
            pages_data = cls.extract_page_data(file_path)

            db.query(DocumentPage).filter(DocumentPage.document_id == document.id).delete()

            page_objects = [
                DocumentPage(
                    document_id=document.id,
                    page_number=page["page_number"],
                    text=page["text"],
                    width=page["width"],
                    height=page["height"],
                    extraction_method=page["extraction_method"],
                    blocks_data=page["blocks_data"],
                )
                for page in pages_data
            ]
            db.add_all(page_objects)

            document.status = "Processed"
            db.commit()
            db.refresh(document)
            logger.info(f"Successfully extracted {len(page_objects)} pages for document {document.id}.")

            chunks = ChunkingService.process_document_chunking(db, document.id)
            logger.info(f"Successfully chunked document {document.id} into {len(chunks)} text chunks.")

            chunks = EmbeddingService.process_chunks_embeddings(db, chunks)
            logger.info(f"Successfully generated embeddings for {len(chunks)} chunks of document {document.id}.")

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
