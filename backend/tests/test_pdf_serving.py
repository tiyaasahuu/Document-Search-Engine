import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import create_access_token, get_password_hash
from app.db.database import SessionLocal
from app.main import app
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_page import DocumentPage
from app.models.user import User
from app.services.embedding_service import EmbeddingService


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
        email=f"pdf_test_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password"),
        full_name="PDF Test User",
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


def test_get_document_metadata(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    doc_id = uuid.uuid4()
    upload_dir = os.path.abspath("uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join("uploads", f"{doc_id}.pdf")

    # Create dummy pdf file on disk
    abs_file_path = os.path.abspath(file_path)
    with open(abs_file_path, "wb") as f:
        f.write(b"%PDF-1.4 dummy content")

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="sample_report.pdf",
        file_size=100,
        mime_type="application/pdf",
        status="Processed",
        file_path=file_path,
    )
    page1 = DocumentPage(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_number=1,
        text="Page 1 content",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    page2 = DocumentPage(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_number=2,
        text="Page 2 content",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )

    try:
        db.add_all([doc, page1, page2])
        db.commit()

        # Test valid document metadata
        res = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(doc_id)
        assert data["original_filename"] == "sample_report.pdf"
        assert data["total_pages"] == 2

    finally:
        db.delete(doc)
        db.commit()
        if os.path.exists(abs_file_path):
            os.remove(abs_file_path)


def test_get_document_metadata_not_found(client: TestClient, auth_headers: dict):
    random_id = uuid.uuid4()
    res = client.get(f"/api/v1/documents/{random_id}", headers=auth_headers)
    assert res.status_code == 404
    assert "Document not found" in res.json()["detail"]


def test_stream_pdf_file_success(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    doc_id = uuid.uuid4()
    upload_dir = os.path.abspath("uploads")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{doc_id}.pdf"
    abs_file_path = os.path.join(upload_dir, filename)

    dummy_pdf_data = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    with open(abs_file_path, "wb") as f:
        f.write(dummy_pdf_data)

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=filename,
        original_filename="user_manual.pdf",
        file_size=len(dummy_pdf_data),
        mime_type="application/pdf",
        status="Uploaded",
        file_path=os.path.join("uploads", filename),
    )

    try:
        db.add(doc)
        db.commit()

        res = client.get(f"/api/v1/documents/{doc_id}/file", headers=auth_headers)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert 'filename="user_manual.pdf"' in res.headers["content-disposition"]
        assert res.content == dummy_pdf_data

    finally:
        db.delete(doc)
        db.commit()
        if os.path.exists(abs_file_path):
            os.remove(abs_file_path)


def test_stream_pdf_file_missing_disk_file(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="missing_file.pdf",
        file_size=500,
        mime_type="application/pdf",
        status="Uploaded",
        file_path=f"uploads/{doc_id}.pdf",
    )

    try:
        db.add(doc)
        db.commit()

        res = client.get(f"/api/v1/documents/{doc_id}/file", headers=auth_headers)
        assert res.status_code == 404
        assert "Document PDF file missing from storage" in res.json()["detail"]

    finally:
        db.delete(doc)
        db.commit()


def test_search_returns_original_filename(client: TestClient, db: Session, test_user: User, auth_headers: dict):
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user.id,
        filename=f"{doc_id}.pdf",
        original_filename="financial_report_2026.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=3,
        text="Financial revenue growth page",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        page_id=page_id,
        page_number=3,
        chunk_index=0,
        text="Annual Q3 revenue increased by 25 percent driven by AI cloud subscriptions.",
        embedding=EmbeddingService.generate_embedding("Annual Q3 revenue increased by 25 percent"),
    )

    try:
        db.add_all([doc, page, chunk])
        db.commit()

        res = client.get(f"/api/v1/search?q=revenue%20growth&limit=5&document_id={doc_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["original_filename"] == "financial_report_2026.pdf"
        assert data[0]["page_number"] == 3

    finally:
        db.delete(doc)
        db.commit()
