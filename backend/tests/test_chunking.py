import os
import sys
import uuid
import tempfile
from io import BytesIO
from unittest.mock import patch
import pymupdf as fitz
from fastapi import UploadFile

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_chunk import DocumentChunk
from app.services.chunking_service import ChunkingService
from app.services.document_service import DocumentService
from app.services.ocr_service import OCRService


def test_normal_text_chunking():
    """Test text shorter than CHUNK_SIZE results in a single chunk."""
    text = "This is a simple short paragraph for testing chunking service."
    chunks = ChunkingService.split_text_into_chunks(text, chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_long_text_chunking_and_overlap():
    """Test text longer than CHUNK_SIZE is split into overlapping chunks."""
    # Generate 1200 characters of text
    sentence = "Alphabetical sample sentence for testing chunking overlap functionality. "
    text = sentence * 18
    assert len(text) > 1000

    chunk_size = 300
    chunk_overlap = 50
    chunks = ChunkingService.split_text_into_chunks(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    assert len(chunks) > 1
    # Verify max chunk size
    for chunk in chunks:
        assert len(chunk) <= chunk_size

    # Verify overlap between consecutive chunks
    step = chunk_size - chunk_overlap
    for i in range(len(chunks) - 1):
        c1 = chunks[i]
        c2 = chunks[i + 1]
        # End of c1 should equal start of c2 for chunk_overlap characters
        overlap_part_c1 = c1[-chunk_overlap:]
        overlap_part_c2 = c2[:chunk_overlap]
        assert overlap_part_c1 == overlap_part_c2


def test_empty_and_whitespace_text_chunking():
    """Test empty, None, and whitespace-only text returns empty list."""
    assert ChunkingService.split_text_into_chunks("") == []
    assert ChunkingService.split_text_into_chunks("   \n\t  ") == []
    assert ChunkingService.split_text_into_chunks(None) == []


def test_multipage_chunking_db_relationships_and_ordering():
    """Test multi-page document chunking preserving document_id, page_id, page_number and chunk order."""
    db = SessionLocal()
    try:
        doc_id = uuid.uuid4()
        document = Document(
            id=doc_id,
            filename=f"{doc_id}.pdf",
            original_filename="multi_page_test.pdf",
            file_size=1024,
            mime_type="application/pdf",
            status="Processing",
            file_path=f"uploads/{doc_id}.pdf",
        )
        db.add(document)
        db.commit()

        # Page 1 (Long text -> 2 chunks)
        page1_id = uuid.uuid4()
        text_page1 = "Page 1 word " * 80  # ~960 chars
        page1 = DocumentPage(
            id=page1_id,
            document_id=doc_id,
            page_number=1,
            text=text_page1,
            width=612.0,
            height=792.0,
            extraction_method="pymupdf",
        )

        # Page 2 (Normal text -> 1 chunk)
        page2_id = uuid.uuid4()
        text_page2 = "Page 2 short content."
        page2 = DocumentPage(
            id=page2_id,
            document_id=doc_id,
            page_number=2,
            text=text_page2,
            width=612.0,
            height=792.0,
            extraction_method="pymupdf",
        )

        db.add_all([page1, page2])
        db.commit()

        # Process chunking
        created_chunks = ChunkingService.process_document_chunking(
            db, doc_id, chunk_size=400, chunk_overlap=50
        )

        assert len(created_chunks) >= 3

        # Verify DB query & ordering
        db_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == doc_id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )

        assert len(db_chunks) == len(created_chunks)

        # Verify indexing sequence (0, 1, 2...)
        for idx, chunk in enumerate(db_chunks):
            assert chunk.chunk_index == idx
            assert chunk.document_id == doc_id
            assert chunk.page_id in (page1_id, page2_id)
            assert chunk.page_number in (1, 2)
            assert len(chunk.text) > 0

        # Verify relationships
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        assert len(db_doc.chunks) == len(db_chunks)

        db_page1 = db.query(DocumentPage).filter(DocumentPage.id == page1_id).first()
        assert len(db_page1.chunks) > 0
        for c in db_page1.chunks:
            assert c.page_number == 1

        # Clean up
        db.delete(document)
        db.commit()
    finally:
        db.close()


def test_chunking_idempotency():
    """Test re-processing chunking on the same document clears previous chunks and does not duplicate."""
    db = SessionLocal()
    try:
        doc_id = uuid.uuid4()
        document = Document(
            id=doc_id,
            filename=f"{doc_id}.pdf",
            original_filename="idempotency_test.pdf",
            file_size=1024,
            mime_type="application/pdf",
            status="Processing",
            file_path=f"uploads/{doc_id}.pdf",
        )
        db.add(document)

        page_id = uuid.uuid4()
        page = DocumentPage(
            id=page_id,
            document_id=doc_id,
            page_number=1,
            text="Idempotency test content repeating sentence. " * 30,
            width=612.0,
            height=792.0,
            extraction_method="pymupdf",
        )
        db.add(page)
        db.commit()

        # Run chunking first time
        chunks_run1 = ChunkingService.process_document_chunking(
            db, doc_id, chunk_size=300, chunk_overlap=30
        )
        count_run1 = (
            db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).count()
        )
        assert count_run1 > 0
        assert count_run1 == len(chunks_run1)

        # Run chunking second time (Idempotency re-run)
        chunks_run2 = ChunkingService.process_document_chunking(
            db, doc_id, chunk_size=300, chunk_overlap=30
        )
        count_run2 = (
            db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).count()
        )

        assert count_run2 == count_run1
        assert len(chunks_run2) == len(chunks_run1)

        # Clean up
        db.delete(document)
        db.commit()
    finally:
        db.close()


def test_end_to_end_upload_extraction_and_chunking():
    """Test end-to-end flow from upload to PyMuPDF/OCR extraction to text chunk creation in DB."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    # Create a 2-page PDF
    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text((50, 100), "End to end PDF chunking test line on page 1. " * 15, fontsize=12)
    p2 = doc.new_page(width=612, height=792)
    p2.insert_text((50, 100), "End to end PDF chunking test line on page 2. " * 15, fontsize=12)
    doc.save(temp_path)
    doc.close()

    db = SessionLocal()
    try:
        with open(temp_path, "rb") as f:
            pdf_bytes = f.read()

        file_obj = BytesIO(pdf_bytes)
        upload_file = UploadFile(filename="e2e_chunking_doc.pdf", file=file_obj)

        uploaded_doc = DocumentService.save_uploaded_document(db, upload_file)
        assert uploaded_doc is not None
        assert uploaded_doc.status == "Processed"

        # Check DB pages
        db_pages = (
            db.query(DocumentPage)
            .filter(DocumentPage.document_id == uploaded_doc.id)
            .order_by(DocumentPage.page_number.asc())
            .all()
        )
        assert len(db_pages) == 2

        # Check DB chunks
        db_chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == uploaded_doc.id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )
        assert len(db_chunks) >= 2

        # Verify pages and chunks linkage
        for chunk in db_chunks:
            assert chunk.document_id == uploaded_doc.id
            assert chunk.page_id in [p.id for p in db_pages]

        # Clean up disk & DB
        uploaded_filepath = os.path.abspath(uploaded_doc.file_path)
        db.delete(uploaded_doc)
        db.commit()
        if os.path.exists(uploaded_filepath):
            os.remove(uploaded_filepath)
    finally:
        db.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    print("Running test_normal_text_chunking...")
    test_normal_text_chunking()
    print("-> PASSED")

    print("Running test_long_text_chunking_and_overlap...")
    test_long_text_chunking_and_overlap()
    print("-> PASSED")

    print("Running test_empty_and_whitespace_text_chunking...")
    test_empty_and_whitespace_text_chunking()
    print("-> PASSED")

    print("Running test_multipage_chunking_db_relationships_and_ordering...")
    test_multipage_chunking_db_relationships_and_ordering()
    print("-> PASSED")

    print("Running test_chunking_idempotency...")
    test_chunking_idempotency()
    print("-> PASSED")

    print("Running test_end_to_end_upload_extraction_and_chunking...")
    test_end_to_end_upload_extraction_and_chunking()
    print("-> PASSED")

    print("\nALL PHASE 3 CHUNKING TESTS PASSED SUCCESSFULLY!")
