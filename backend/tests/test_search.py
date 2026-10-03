import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import create_access_token, get_password_hash
from app.db.database import SessionLocal
from app.main import app
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_page import DocumentPage
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.services.search_service import SearchService


@pytest.fixture
def db():
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(db: Session):
    user = User(
        email=f"search_test_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password"),
        full_name="Search Test User",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture
def auth_headers(test_user: User):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


def test_semantic_ranking(db: Session, test_user: User):
    """Verify that search results are ranked by semantic similarity score (descending)."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="ranking_test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Sample page text",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )

    chunk_ai = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=0,
        text="Artificial intelligence, neural networks, and deep learning algorithms transform modern technology.",
        embedding=EmbeddingService.generate_embedding(
            "Artificial intelligence, neural networks, and deep learning algorithms transform modern technology."
        ),
    )

    chunk_baking = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=1,
        text="Baking delicious chocolate chip cookies requires flour, sugar, butter, and vanilla extract.",
        embedding=EmbeddingService.generate_embedding(
            "Baking delicious chocolate chip cookies requires flour, sugar, butter, and vanilla extract."
        ),
    )

    try:
        db.add_all([doc, page, chunk_ai, chunk_baking])
        db.commit()

        results = SearchService.search(db, query="machine learning algorithms", current_user=test_user, limit=10)

        assert len(results) >= 2
        assert results[0].document_id == doc_id
        assert results[0].chunk_index == 0
        assert "Artificial intelligence" in results[0].text
        assert results[0].similarity_score > results[1].similarity_score

    finally:
        db.delete(doc)
        db.commit()


def test_empty_query_validation(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify that empty, whitespace, or missing query parameter returns HTTP 400 Bad Request."""
    with pytest.raises(ValueError, match="Query string cannot be empty"):
        SearchService.search(db, query="", current_user=test_user)

    with pytest.raises(ValueError, match="Query string cannot be empty"):
        SearchService.search(db, query="   ", current_user=test_user)

    res1 = client.get("/api/v1/search?q=", headers=auth_headers)
    assert res1.status_code == 400
    assert "Query string cannot be empty" in res1.json()["detail"]

    res2 = client.get("/api/v1/search?q=%20%20%20", headers=auth_headers)
    assert res2.status_code == 400

    res3 = client.get("/api/v1/search", headers=auth_headers)
    assert res3.status_code == 400


def test_limit_validation(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify limit parameter validation (invalid limit returns 400, valid limit restricts count)."""
    with pytest.raises(ValueError, match="Limit must be between 1 and 100"):
        SearchService.search(db, query="test", current_user=test_user, limit=0)

    with pytest.raises(ValueError, match="Limit must be between 1 and 100"):
        SearchService.search(db, query="test", current_user=test_user, limit=-5)

    with pytest.raises(ValueError, match="Limit must be between 1 and 100"):
        SearchService.search(db, query="test", current_user=test_user, limit=101)

    res_zero = client.get("/api/v1/search?q=test&limit=0", headers=auth_headers)
    assert res_zero.status_code == 400

    res_negative = client.get("/api/v1/search?q=test&limit=-1", headers=auth_headers)
    assert res_negative.status_code == 400

    res_too_large = client.get("/api/v1/search?q=test&limit=150", headers=auth_headers)
    assert res_too_large.status_code == 400

    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="limit_test.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Limit test page",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            page_id=page_id,
            page_number=1,
            chunk_index=i,
            text=f"Limit test sentence number {i} with semantic information.",
            embedding=EmbeddingService.generate_embedding(f"Limit test sentence number {i}"),
        )
        for i in range(5)
    ]

    try:
        db.add_all([doc, page] + chunks)
        db.commit()

        results_limit_2 = SearchService.search(db, query="Limit test sentence", current_user=test_user, limit=2)
        assert len(results_limit_2) == 2

    finally:
        db.delete(doc)
        db.commit()


def test_document_id_filtering(db: Session, test_user: User):
    """Verify optional filtering by document_id limits results strictly to that document."""
    doc1_id = uuid.uuid4()
    doc2_id = uuid.uuid4()

    page1_id = uuid.uuid4()
    page2_id = uuid.uuid4()

    doc1 = Document(
        id=doc1_id,
        user_id=test_user.id,
        filename=f"{doc1_id}.pdf",
        original_filename="doc1.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc1_id}.pdf",
    )
    doc2 = Document(
        id=doc2_id,
        user_id=test_user.id,
        filename=f"{doc2_id}.pdf",
        original_filename="doc2.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc2_id}.pdf",
    )

    page1 = DocumentPage(
        id=page1_id, document_id=doc1_id, page_number=1, text="Page 1", width=612.0, height=792.0, extraction_method="pymupdf"
    )
    page2 = DocumentPage(
        id=page2_id, document_id=doc2_id, page_number=1, text="Page 2", width=612.0, height=792.0, extraction_method="pymupdf"
    )

    chunk1 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc1_id,
        page_id=page1_id,
        page_number=1,
        chunk_index=0,
        text="Quantum mechanics and wave functions analysis.",
        embedding=EmbeddingService.generate_embedding("Quantum mechanics and wave functions analysis."),
    )

    chunk2 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc2_id,
        page_id=page2_id,
        page_number=1,
        chunk_index=0,
        text="Quantum entanglement and quantum computing applications.",
        embedding=EmbeddingService.generate_embedding("Quantum entanglement and quantum computing applications."),
    )

    try:
        db.add_all([doc1, doc2, page1, page2, chunk1, chunk2])
        db.commit()

        res_doc1 = SearchService.search(db, query="quantum physics", current_user=test_user, limit=10, document_id=doc1_id)
        assert len(res_doc1) == 1
        assert res_doc1[0].document_id == doc1_id

        res_doc2 = SearchService.search(db, query="quantum physics", current_user=test_user, limit=10, document_id=doc2_id)
        assert len(res_doc2) == 1
        assert res_doc2[0].document_id == doc2_id

    finally:
        db.delete(doc1)
        db.delete(doc2)
        db.commit()


def test_results_with_no_matching_documents(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify that searching with non-existent document_id returns empty result list or 404."""
    random_doc_id = uuid.uuid4()
    with pytest.raises(ValueError, match="Document not found"):
        SearchService.search(db, query="anything", current_user=test_user, limit=10, document_id=random_doc_id)

    res = client.get(f"/api/v1/search?q=anything&document_id={random_doc_id}", headers=auth_headers)
    assert res.status_code == 404


def test_api_endpoint_response(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify GET /api/v1/search endpoint returns 200 OK and expected JSON schema fields."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="api_test.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="API test page text.",
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
        text="FastAPI backend semantic search endpoint verification test.",
        embedding=EmbeddingService.generate_embedding("FastAPI backend semantic search endpoint verification test."),
    )

    try:
        db.add_all([doc, page, chunk])
        db.commit()

        response = client.get(f"/api/v1/search?q=FastAPI%20search&limit=5&document_id={doc_id}", headers=auth_headers)
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1

        item = data[0]
        assert item["document_id"] == str(doc_id)
        assert item["page_number"] == 1
        assert item["chunk_index"] == 0
        assert "FastAPI backend semantic search" in item["text"]
        assert "similarity_score" in item
        assert isinstance(item["similarity_score"], float)

    finally:
        db.delete(doc)
        db.commit()
