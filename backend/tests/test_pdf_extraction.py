import os
import sys
import tempfile
from unittest.mock import patch
import pymupdf as fitz
from io import BytesIO
from fastapi import UploadFile

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.services.pdf_extractor import PDFExtractorService, PDFExtractionError
from app.services.ocr_service import OCRService
from app.services.document_service import DocumentService


def create_text_pdf(num_pages: int = 2) -> str:
    """Creates a PDF containing regular text (Normal PDF)."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=612, height=792)
        text = f"Sample text content for page {i + 1}. " * 5  # Ensure > OCR_MIN_TEXT_CHARS
        page.insert_text((50, 100), text, fontsize=12)

    doc.save(temp_path)
    doc.close()
    return temp_path


def create_scanned_pdf() -> str:
    """Creates a PDF containing an image/blank page with no extractable PyMuPDF text (Scanned PDF)."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    # Draw a shape/pixmap rectangle without inserting text primitives
    rect = fitz.Rect(50, 50, 300, 300)
    shape = page.new_shape()
    shape.draw_rect(rect)
    shape.finish(color=(0, 0, 0), fill=(0.8, 0.8, 0.8))
    shape.commit()

    doc.save(temp_path)
    doc.close()
    return temp_path


def create_mixed_pdf() -> str:
    """Creates a 2-page PDF: Page 1 has text, Page 2 is scanned/image only (Mixed PDF)."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    doc = fitz.open()
    # Page 1: Text
    page1 = doc.new_page(width=612, height=792)
    page1.insert_text((50, 100), "Normal text content for page 1. " * 5, fontsize=12)

    # Page 2: Image/No text
    page2 = doc.new_page(width=612, height=792)
    rect = fitz.Rect(50, 50, 300, 300)
    shape = page2.new_shape()
    shape.draw_rect(rect)
    shape.finish(color=(0, 0, 0), fill=(0.8, 0.8, 0.8))
    shape.commit()

    doc.save(temp_path)
    doc.close()
    return temp_path


def test_normal_pdf_extraction():
    """Test standard PDF with sufficient PyMuPDF text."""
    pdf_path = create_text_pdf(num_pages=2)
    try:
        pages = PDFExtractorService.extract_page_data(pdf_path)
        assert len(pages) == 2
        for page in pages:
            assert page["extraction_method"] == "pymupdf", f"Expected pymupdf, got {page['extraction_method']}"
            assert len(page["text"].strip()) >= settings.OCR_MIN_TEXT_CHARS
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


def test_scanned_pdf_with_ocr_success():
    """Test scanned PDF page triggering OCR fallback successfully."""
    pdf_path = create_scanned_pdf()
    try:
        with patch.object(OCRService, "extract_text_from_page", return_value=("OCR extracted text content from scanned page", "ocr")):
            pages = PDFExtractorService.extract_page_data(pdf_path)
            assert len(pages) == 1
            assert pages[0]["extraction_method"] == "ocr"
            assert pages[0]["text"] == "OCR extracted text content from scanned page"
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


def test_scanned_pdf_with_ocr_failure():
    """Test scanned PDF page when OCR fails/is unavailable (tracks 'ocr_failed')."""
    pdf_path = create_scanned_pdf()
    try:
        with patch.object(OCRService, "extract_text_from_page", return_value=(None, "ocr_failed")):
            pages = PDFExtractorService.extract_page_data(pdf_path)
            assert len(pages) == 1
            assert pages[0]["extraction_method"] == "ocr_failed"
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


def test_mixed_pdf_extraction():
    """Test mixed PDF where Page 1 uses PyMuPDF and Page 2 uses OCR."""
    pdf_path = create_mixed_pdf()
    try:
        with patch.object(OCRService, "extract_text_from_page", return_value=("OCR text for page 2", "ocr")):
            pages = PDFExtractorService.extract_page_data(pdf_path)
            assert len(pages) == 2
            assert pages[0]["extraction_method"] == "pymupdf", f"Page 1 expected pymupdf, got {pages[0]['extraction_method']}"
            assert pages[1]["extraction_method"] == "ocr", f"Page 2 expected ocr, got {pages[1]['extraction_method']}"
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


def test_ocr_service_graceful_failure_handling():
    """Test OCRService directly when Tesseract binary is missing/raises exception."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    
    # Simulate Tesseract missing
    with patch("pytesseract.image_to_string", side_effect=Exception("Tesseract error")):
        ocr_text, method = OCRService.extract_text_from_page(page)
        assert ocr_text is None
        assert method == "ocr_failed"

    doc.close()


def test_full_document_upload_and_extraction_in_db():
    """Test end-to-end upload and persistence of extraction_method in PostgreSQL."""
    db = SessionLocal()
    pdf_path = create_mixed_pdf()
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        file_obj = BytesIO(pdf_bytes)
        upload_file = UploadFile(filename="mixed_test_document.pdf", file=file_obj)

        from app.models.user import User
        user = db.query(User).first()
        if not user:
            user = User(id=uuid.UUID("00000000-0000-0000-0000-000000000000"), email="pdf_test@example.com", hashed_password="pass", full_name="PDF User")
            db.add(user)
            db.commit()

        with patch.object(OCRService, "extract_text_from_page", return_value=("OCR text for page 2", "ocr")):
            doc = DocumentService.save_uploaded_document(db, upload_file, user)
            assert doc is not None
            assert doc.status == "Processed"

            # Check DB records
            db_pages = (
                db.query(DocumentPage)
                .filter(DocumentPage.document_id == doc.id)
                .order_by(DocumentPage.page_number.asc())
                .all()
            )
            assert len(db_pages) == 2
            assert db_pages[0].extraction_method == "pymupdf"
            assert db_pages[1].extraction_method == "ocr"
            assert db_pages[1].text == "OCR text for page 2"

            # Clean up DB
            uploaded_filepath = os.path.abspath(doc.file_path)
            db.delete(doc)
            db.commit()
            if os.path.exists(uploaded_filepath):
                os.remove(uploaded_filepath)
    finally:
        db.close()
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


if __name__ == "__main__":
    print("Running test_normal_pdf_extraction...")
    test_normal_pdf_extraction()
    print("-> PASSED")

    print("Running test_scanned_pdf_with_ocr_success...")
    test_scanned_pdf_with_ocr_success()
    print("-> PASSED")

    print("Running test_scanned_pdf_with_ocr_failure...")
    test_scanned_pdf_with_ocr_failure()
    print("-> PASSED")

    print("Running test_mixed_pdf_extraction...")
    test_mixed_pdf_extraction()
    print("-> PASSED")

    print("Running test_ocr_service_graceful_failure_handling...")
    test_ocr_service_graceful_failure_handling()
    print("-> PASSED")

    print("Running test_full_document_upload_and_extraction_in_db...")
    test_full_document_upload_and_extraction_in_db()
    print("-> PASSED")

    print("\nALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY!")
