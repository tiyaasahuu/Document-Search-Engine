import os
import sys
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_chunk import DocumentChunk


def test_vector_extension_exists():
    """Verify that the PostgreSQL 'vector' extension is installed and active."""
    db: Session = SessionLocal()
    try:
        result = db.execute(
            text("SELECT extname FROM pg_extension WHERE extname = 'vector';")
        ).fetchone()
        assert result is not None, "pgvector extension is not installed in PostgreSQL database!"
        assert result[0] == "vector", f"Expected 'vector', got '{result[0]}'"
        print(" -> Vector extension verification: SUCCESS")
    finally:
        db.close()


def test_document_chunks_embedding_column_definition():
    """Verify that document_chunks.embedding column exists, is vector type, and nullable."""
    db: Session = SessionLocal()
    try:
        col_info = db.execute(
            text(
                "SELECT column_name, udt_name, is_nullable "
                "FROM information_schema.columns "
                "WHERE table_name = 'document_chunks' AND column_name = 'embedding';"
            )
        ).fetchone()
        assert col_info is not None, "Column 'embedding' does not exist in 'document_chunks' table!"
        column_name, udt_name, is_nullable = col_info
        assert column_name == "embedding"
        assert udt_name == "vector", f"Expected udt_name 'vector', got '{udt_name}'"
        assert is_nullable == "YES", f"Expected is_nullable 'YES', got '{is_nullable}'"

        # Check dimension length (384)
        dim_info = db.execute(
            text(
                "SELECT atttypmod FROM pg_attribute "
                "WHERE attrelid = 'document_chunks'::regclass AND attname = 'embedding';"
            )
        ).fetchone()
        assert dim_info is not None
        atttypmod = dim_info[0]
        # In pgvector, atttypmod for vector(N) stores N
        assert atttypmod == 384, f"Expected vector dimension 384, got {atttypmod}"

        print(" -> Embedding column definition (vector(384), nullable=True) verification: SUCCESS")
    finally:
        db.close()


def test_hnsw_cosine_index_exists():
    """Verify that the HNSW cosine index exists on document_chunks.embedding."""
    db: Session = SessionLocal()
    try:
        index_info = db.execute(
            text(
                "SELECT indexname, indexdef FROM pg_indexes "
                "WHERE tablename = 'document_chunks' AND indexname = 'ix_document_chunks_embedding_hnsw';"
            )
        ).fetchone()
        assert index_info is not None, "HNSW index 'ix_document_chunks_embedding_hnsw' does not exist!"
        indexname, indexdef = index_info
        assert indexname == "ix_document_chunks_embedding_hnsw"
        assert "hnsw" in indexdef.lower(), f"Expected 'hnsw' in index definition: {indexdef}"
        assert "vector_cosine_ops" in indexdef.lower(), f"Expected 'vector_cosine_ops' in index definition: {indexdef}"

        print(" -> HNSW cosine index verification: SUCCESS")
    finally:
        db.close()


def test_chunk_data_preservation_with_nullable_embedding():
    """Verify that DocumentChunk records can be created, retrieved, and preserved with embedding=None."""
    db: Session = SessionLocal()
    try:
        doc_id = uuid.uuid4()
        page_id = uuid.uuid4()

        from app.models.user import User
        user = db.query(User).first()
        if not user:
            user = User(id=uuid.uuid4(), email=f"pgv_{uuid.uuid4().hex[:8]}@example.com", hashed_password="pass", full_name="PGV User")
            db.add(user)
            db.commit()

        document = Document(
            id=doc_id,
            user_id=user.id,
            filename=f"{doc_id}.pdf",
            original_filename="pgvector_test_doc.pdf",
            file_size=512,
            mime_type="application/pdf",
            status="Processed",
            file_path=f"uploads/{doc_id}.pdf",
        )
        page = DocumentPage(
            id=page_id,
            document_id=doc_id,
            page_number=1,
            text="Testing pgvector nullable embedding preservation.",
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
            text="Testing pgvector nullable embedding preservation.",
            embedding=None,  # Nullable embedding
        )

        db.add(document)
        db.add(page)
        db.add(chunk)
        db.commit()

        # Retrieve chunk from DB
        retrieved_chunk = (
            db.query(DocumentChunk).filter(DocumentChunk.id == chunk.id).first()
        )
        assert retrieved_chunk is not None
        assert retrieved_chunk.embedding is None
        assert retrieved_chunk.text == "Testing pgvector nullable embedding preservation."

        # Clean up test record
        db.delete(document)
        db.commit()

        print(" -> Data preservation test (nullable embedding=None): SUCCESS")
    finally:
        db.close()


if __name__ == "__main__":
    print("\n--- Running pgvector Setup Verification Tests ---")
    test_vector_extension_exists()
    test_document_chunks_embedding_column_definition()
    test_hnsw_cosine_index_exists()
    test_chunk_data_preservation_with_nullable_embedding()
    print("\nALL PGVECTOR SETUP VERIFICATION TESTS PASSED SUCCESSFULLY!")
