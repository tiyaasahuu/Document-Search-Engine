import os
import sys
import uuid
import pytest
import pymupdf as fitz
from sqlalchemy.orm import Session

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import EmbeddingService, EXPECTED_EMBEDDING_DIM
from app.services.pdf_extractor import PDFExtractorService


@pytest.fixture
def db():
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_embedding_dimension_is_384():
    """Verify that sentence-transformers model generates 384-dimensional embeddings."""
    text = "The quick brown fox jumps over the lazy dog."
    embedding = EmbeddingService.generate_embedding(text)
    assert embedding is not None, "Generated embedding should not be None."
    assert len(embedding) == EXPECTED_EMBEDDING_DIM, (
        f"Expected dimension {EXPECTED_EMBEDDING_DIM}, got {len(embedding)}"
    )
    assert isinstance(embedding[0], float)


def test_empty_chunks_are_skipped():
    """Verify that empty, None, and whitespace-only text inputs return None and set embedding=None."""
    assert EmbeddingService.generate_embedding("") is None
    assert EmbeddingService.generate_embedding("   ") is None
    assert EmbeddingService.generate_embedding(None) is None
    assert EmbeddingService.generate_embedding("\n\t  \n") is None

    # Test with batch helper
    batch_res = EmbeddingService.generate_embeddings_batch(["", "  ", "Valid text", "\t"])
    assert batch_res[0] is None
    assert batch_res[1] is None
    assert batch_res[2] is not None
    assert len(batch_res[2]) == 384
    assert batch_res[3] is None


def test_embeddings_are_stored_in_postgresql(db: Session):
    """Verify that generated embeddings are correctly stored and retrieved from PostgreSQL document_chunks table."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        filename=f"{doc_id}.pdf",
        original_filename="embedding_test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processing",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Sample document text for pgvector embedding storage test.",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=0,
        text="Sample document text for pgvector embedding storage test.",
        embedding=None,
    )

    try:
        db.add(doc)
        db.add(page)
        db.add(chunk)
        db.commit()

        # Process embedding
        EmbeddingService.process_chunks_embeddings(db, [chunk])

        # Retrieve chunk from database
        db_chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk.id).first()
        assert db_chunk is not None
        assert db_chunk.embedding is not None, "Embedding should be stored in PostgreSQL."
        assert len(db_chunk.embedding) == 384, (
            f"Retrieved embedding dimension expected 384, got {len(db_chunk.embedding)}"
        )
    finally:
        # Cleanup
        db.delete(doc)
        db.commit()


def test_existing_embeddings_are_not_unnecessarily_regenerated(db: Session, monkeypatch):
    """Verify idempotency: existing embeddings are skipped and model encoding is not called unless forced."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    dummy_vec = [0.1] * 384

    doc = Document(
        id=doc_id,
        filename=f"{doc_id}.pdf",
        original_filename="idempotency_test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processing",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Idempotency test text content.",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=0,
        text="Idempotency test text content.",
        embedding=dummy_vec,
    )

    try:
        db.add(doc)
        db.add(page)
        db.add(chunk)
        db.commit()

        encode_called = False

        def fake_encode(*args, **kwargs):
            nonlocal encode_called
            encode_called = True
            return [[0.9] * 384]

        # Patch batch generation to detect calls
        monkeypatch.setattr(EmbeddingService, "generate_embeddings_batch", fake_encode)

        # Call process_chunks_embeddings without force_reload
        EmbeddingService.process_chunks_embeddings(db, [chunk], force_reload=False)

        assert not encode_called, "generate_embeddings_batch should NOT be called when embedding already exists."

        # Verify embedding value remained dummy_vec
        db_chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk.id).first()
        assert list(db_chunk.embedding) == dummy_vec

    finally:
        db.delete(doc)
        db.commit()


def test_end_to_end_pdf_upload_creates_chunks_with_embeddings(db: Session, tmp_path):
    """Verify end-to-end pipeline: PDF extraction -> chunking -> embedding generation."""
    # Create a temporary single-page PDF with text
    pdf_path = str(tmp_path / "sample_test.pdf")
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "End-to-end PDF processing test with sentence-transformers embedding generation.")
    doc.save(pdf_path)
    doc.close()

    doc_id = uuid.uuid4()
    document = Document(
        id=doc_id,
        filename=f"{doc_id}.pdf",
        original_filename="sample_test.pdf",
        file_size=os.path.getsize(pdf_path),
        mime_type="application/pdf",
        status="Uploaded",
        file_path=pdf_path,
    )

    try:
        db.add(document)
        db.commit()

        # Run process_document_extraction
        success = PDFExtractorService.process_document_extraction(db, document)
        assert success is True, "PDF extraction and chunking pipeline should return True."

        # Verify chunks created and embeddings set
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
        assert len(chunks) > 0, "Document chunks should be generated."

        for c in chunks:
            assert c.embedding is not None, f"Chunk {c.id} should have a non-null embedding."
            assert len(c.embedding) == 384, f"Chunk {c.id} embedding should have dimension 384."

    finally:
        db.delete(document)
        db.commit()
