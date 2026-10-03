import os
import sys
import uuid
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.database import SessionLocal
from app.main import app
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_page import DocumentPage
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService, RAGServiceError, FALLBACK_NOT_FOUND_MSG


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
        email=f"rag_test_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password"),
        full_name="RAG Test User",
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


def test_rag_answer_generation_success(db: Session, test_user: User, monkeypatch):
    """Verify end-to-end RAG answer generation with mocked Gemini API client."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="rag_test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Quantum computing utilizes qubits for parallel computation.",
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
        text="Quantum computing utilizes qubits for parallel computation and superpositions.",
        embedding=EmbeddingService.generate_embedding(
            "Quantum computing utilizes qubits for parallel computation and superpositions."
        ),
    )

    db.add(doc)
    db.add(page)
    db.add(chunk)
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_api_key_12345")

    try:
        mock_response = MagicMock()
        mock_response.text = "Quantum computing uses qubits to achieve parallel computation."

        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content.return_value = mock_response
            mock_client_cls.return_value = mock_client_instance

            res = RAGService.answer_question(
                db=db,
                question="What does quantum computing utilize?",
                current_user=test_user,
                limit=5,
            )

            assert res.question == "What does quantum computing utilize?"
            assert res.answer == "Quantum computing uses qubits to achieve parallel computation."
            assert len(res.sources) >= 1
            assert res.sources[0].document_id == doc_id
            assert res.sources[0].page_number == 1
            assert res.sources[0].chunk_index == 0
            assert "Quantum computing" in res.sources[0].text
            assert isinstance(res.sources[0].similarity_score, float)

            mock_client_cls.assert_called_once_with(api_key="test_api_key_12345")
            mock_client_instance.models.generate_content.assert_called_once()

    finally:
        db.delete(doc)
        db.commit()


def test_empty_question_validation(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify empty or whitespace question returns 400 Bad Request."""
    with pytest.raises(ValueError, match="Question string cannot be empty"):
        RAGService.answer_question(db, question="", current_user=test_user)

    with pytest.raises(ValueError, match="Question string cannot be empty"):
        RAGService.answer_question(db, question="   ", current_user=test_user)

    res1 = client.post("/api/v1/ask", json={"question": ""}, headers=auth_headers)
    assert res1.status_code == 400
    assert "Question string cannot be empty" in res1.json()["detail"]

    res2 = client.post("/api/v1/ask", json={"question": "   "}, headers=auth_headers)
    assert res2.status_code == 400


def test_limit_validation(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    """Verify limit parameter range validation (1..20)."""
    with pytest.raises(ValueError, match="Limit must be between 1 and 20"):
        RAGService.answer_question(db, question="What is AI?", current_user=test_user, limit=0)

    with pytest.raises(ValueError, match="Limit must be between 1 and 20"):
        RAGService.answer_question(db, question="What is AI?", current_user=test_user, limit=25)

    res_zero = client.post("/api/v1/ask", json={"question": "What is AI?", "limit": 0}, headers=auth_headers)
    assert res_zero.status_code == 422 or res_zero.status_code == 400

    res_too_large = client.post("/api/v1/ask", json={"question": "What is AI?", "limit": 50}, headers=auth_headers)
    assert res_too_large.status_code == 422 or res_too_large.status_code == 400


def test_document_id_filtering(db: Session, test_user: User, monkeypatch):
    """Verify RAGService filters retrieved sources by document_id when provided."""
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

    page1 = DocumentPage(id=page1_id, document_id=doc1_id, page_number=1, text="P1", width=612.0, height=792.0, extraction_method="pymupdf")
    page2 = DocumentPage(id=page2_id, document_id=doc2_id, page_number=1, text="P2", width=612.0, height=792.0, extraction_method="pymupdf")

    chunk1 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc1_id,
        page_id=page1_id,
        page_number=1,
        chunk_index=0,
        text="Solar energy panels absorb sunlight to generate electricity.",
        embedding=EmbeddingService.generate_embedding("Solar energy panels absorb sunlight to generate electricity."),
    )

    chunk2 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc2_id,
        page_id=page2_id,
        page_number=1,
        chunk_index=0,
        text="Wind turbines convert kinetic wind energy into electrical power.",
        embedding=EmbeddingService.generate_embedding("Wind turbines convert kinetic wind energy into electrical power."),
    )

    db.add_all([doc1, doc2, page1, page2, chunk1, chunk2])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_key")

    try:
        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content.return_value = MagicMock(text="Solar panels produce electricity.")
            mock_client_cls.return_value = mock_client_instance

            res = RAGService.answer_question(
                db=db,
                question="Tell me about renewable energy",
                current_user=test_user,
                limit=5,
                document_id=doc1_id,
            )

            assert len(res.sources) == 1
            assert res.sources[0].document_id == doc1_id

    finally:
        db.delete(doc1)
        db.delete(doc2)
        db.commit()


def test_no_matching_chunks_fallback(db: Session, test_user: User):
    """Verify that when no chunks match query/filter, fallback message is returned without calling Gemini API."""
    random_doc_id = uuid.uuid4()

    with patch("google.genai.Client") as mock_client_cls:
        with pytest.raises(ValueError, match="Document not found"):
            RAGService.answer_question(
                db=db,
                question="Non-existent topic",
                current_user=test_user,
                limit=5,
                document_id=random_doc_id,
            )
        mock_client_cls.assert_not_called()


def test_missing_gemini_api_key(client: TestClient, db: Session, test_user: User, auth_headers: dict, monkeypatch):
    """Verify 503 response when GEMINI_API_KEY is not set."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(id=doc_id, user_id=test_user.id, filename=f"{doc_id}.pdf", original_filename="key_test.pdf", file_size=512, mime_type="application/pdf", status="Processed", file_path=f"uploads/{doc_id}.pdf")
    page = DocumentPage(id=page_id, document_id=doc_id, page_number=1, text="Text", width=612.0, height=792.0, extraction_method="pymupdf")
    chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=0,
        text="Sample text content for key test.",
        embedding=EmbeddingService.generate_embedding("Sample text content for key test."),
    )

    db.add_all([doc, page, chunk])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    try:
        with pytest.raises(RAGServiceError, match="Gemini API key is not configured"):
            RAGService.answer_question(db, question="Sample question", current_user=test_user, limit=5)

        res = client.post("/api/v1/ask", json={"question": "Sample question"}, headers=auth_headers)
        assert res.status_code == 503
        assert "Gemini API key is not configured" in res.json()["detail"]

    finally:
        db.delete(doc)
        db.commit()


def test_gemini_api_failure_handling(client: TestClient, db: Session, test_user: User, auth_headers: dict, monkeypatch):
    """Verify HTTP 502 Bad Gateway response when Gemini API raises an exception."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(id=doc_id, user_id=test_user.id, filename=f"{doc_id}.pdf", original_filename="err_test.pdf", file_size=512, mime_type="application/pdf", status="Processed", file_path=f"uploads/{doc_id}.pdf")
    page = DocumentPage(id=page_id, document_id=doc_id, page_number=1, text="Err Text", width=612.0, height=792.0, extraction_method="pymupdf")
    chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=1,
        chunk_index=0,
        text="Sample text content for error test.",
        embedding=EmbeddingService.generate_embedding("Sample text content for error test."),
    )

    db.add_all([doc, page, chunk])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_key")

    try:
        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content.side_effect = Exception("API connection failure")
            mock_client_cls.return_value = mock_client_instance

            res = client.post("/api/v1/ask", json={"question": "Sample question"}, headers=auth_headers)
            assert res.status_code == 502
            assert "Gemini API error" in res.json()["detail"]

    finally:
        db.delete(doc)
        db.commit()


def test_post_ask_api_endpoint(client: TestClient, db: Session, test_user: User, auth_headers: dict, monkeypatch):
    """Verify POST /api/v1/ask endpoint returns 200 OK and expected JSON schema fields."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="api_ask_test.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="FastAPI backend RAG integration test.",
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
        text="FastAPI backend RAG integration endpoint answer test chunk.",
        embedding=EmbeddingService.generate_embedding("FastAPI backend RAG integration endpoint answer test chunk."),
    )

    db.add_all([doc, page, chunk])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_test_key")

    try:
        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content.return_value = MagicMock(
                text="The FastAPI backend RAG integration endpoint passed verification."
            )
            mock_client_cls.return_value = mock_client_instance

            payload = {
                "question": "How does the RAG integration work?",
                "limit": 3,
                "document_id": str(doc_id),
            }
            response = client.post("/api/v1/ask", json=payload, headers=auth_headers)
            assert response.status_code == 200

            data = response.json()
            assert data["question"] == "How does the RAG integration work?"
            assert "FastAPI backend RAG integration" in data["answer"]
            assert isinstance(data["sources"], list)
            assert len(data["sources"]) == 1

            src = data["sources"][0]
            assert src["document_id"] == str(doc_id)
            assert src["page_number"] == 1
            assert src["chunk_index"] == 0
            assert "FastAPI backend RAG" in src["text"]
            assert isinstance(src["similarity_score"], float)

    finally:
        db.delete(doc)
        db.commit()
