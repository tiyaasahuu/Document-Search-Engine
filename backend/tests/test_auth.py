import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
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


def test_user_registration_success(client: TestClient, db: Session):
    test_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "email": test_email,
        "password": "Password123!",
        "full_name": "Test User",
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_email
    assert data["user"]["full_name"] == "Test User"

    # Verify user saved in DB with hashed password (not plain text)
    db_user = db.scalar(select(User).where(User.email == test_email))
    assert db_user is not None
    assert db_user.hashed_password != "Password123!"
    assert db_user.hashed_password.startswith("$2b$")

    # Cleanup
    db.delete(db_user)
    db.commit()


def test_user_registration_duplicate_email(client: TestClient, db: Session):
    test_email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    hashed_pwd = get_password_hash("Password123!")
    user = User(email=test_email, hashed_password=hashed_pwd, full_name="Original User")
    db.add(user)
    db.commit()

    try:
        payload = {
            "email": test_email,
            "password": "Password456!",
            "full_name": "Duplicate User",
        }
        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 400
        assert "Email already registered" in res.json()["detail"]
    finally:
        db.delete(user)
        db.commit()


def test_login_success(client: TestClient, db: Session):
    test_email = f"login_{uuid.uuid4().hex[:8]}@example.com"
    raw_password = "SecurePassword123!"
    user = User(email=test_email, hashed_password=get_password_hash(raw_password), full_name="Login User")
    db.add(user)
    db.commit()

    try:
        payload = {"email": test_email, "password": raw_password}
        res = client.post("/api/v1/auth/login", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_email

        # Verify /auth/me with valid token
        headers = {"Authorization": f"Bearer {data['access_token']}"}
        me_res = client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == test_email
    finally:
        db.delete(user)
        db.commit()


def test_login_invalid_credentials(client: TestClient, db: Session):
    test_email = f"wrong_{uuid.uuid4().hex[:8]}@example.com"
    user = User(email=test_email, hashed_password=get_password_hash("CorrectPassword"), full_name="Wrong User")
    db.add(user)
    db.commit()

    try:
        # Invalid password
        res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "WrongPassword"})
        assert res.status_code == 401
        assert "Incorrect email or password" in res.json()["detail"]

        # Non-existent email
        res2 = client.post("/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "Password123!"})
        assert res2.status_code == 401
    finally:
        db.delete(user)
        db.commit()


def test_protected_endpoints_unauthenticated(client: TestClient):
    assert client.get("/api/v1/documents").status_code == 401
    assert client.get(f"/api/v1/documents/{uuid.uuid4()}").status_code == 401
    assert client.get(f"/api/v1/documents/{uuid.uuid4()}/file").status_code == 401
    assert client.get("/api/v1/search?q=test").status_code == 401
    assert client.post("/api/v1/ask", json={"question": "test"}).status_code == 401


def test_invalid_or_expired_jwt_token(client: TestClient):
    headers = {"Authorization": "Bearer invalid_fake_jwt_token_12345"}
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    assert client.get("/api/v1/documents", headers=headers).status_code == 401


def test_document_ownership_and_user_isolation(client: TestClient, db: Session):
    # Create User A and User B
    user_a = User(id=uuid.uuid4(), email=f"usera_{uuid.uuid4().hex[:8]}@example.com", hashed_password=get_password_hash("pass"), full_name="User A")
    user_b = User(id=uuid.uuid4(), email=f"userb_{uuid.uuid4().hex[:8]}@example.com", hashed_password=get_password_hash("pass"), full_name="User B")
    db.add_all([user_a, user_b])
    db.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create dummy file on disk
    upload_dir = os.path.abspath("uploads")
    os.makedirs(upload_dir, exist_ok=True)
    doc_a_id = uuid.uuid4()
    file_path_a = os.path.join(upload_dir, f"{doc_a_id}.pdf")
    with open(file_path_a, "wb") as f:
        f.write(b"%PDF-1.4 User A confidential document")

    doc_a = Document(
        id=doc_a_id,
        user_id=user_a.id,
        filename=f"{doc_a_id}.pdf",
        original_filename="user_a_secret.pdf",
        file_size=100,
        mime_type="application/pdf",
        status="Processed",
        file_path=os.path.join("uploads", f"{doc_a_id}.pdf"),
    )
    page_a_id = uuid.uuid4()
    page_a = DocumentPage(
        id=page_a_id,
        document_id=doc_a_id,
        page_number=1,
        text="User A financial strategy and quarterly profits.",
        width=612.0,
        height=792.0,
        extraction_method="pymupdf",
    )
    chunk_a = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_a_id,
        page_id=page_a_id,
        page_number=1,
        chunk_index=0,
        text="User A financial strategy and quarterly profits.",
        embedding=EmbeddingService.generate_embedding("User A financial strategy and quarterly profits"),
    )

    try:
        db.add_all([doc_a, page_a, chunk_a])
        db.commit()

        # 1. User A lists documents -> sees doc_a
        res_a = client.get("/api/v1/documents", headers=headers_a)
        assert res_a.status_code == 200
        docs_a = res_a.json()
        assert len(docs_a) == 1
        assert docs_a[0]["id"] == str(doc_a_id)

        # 2. User B lists documents -> receives empty list
        res_b = client.get("/api/v1/documents", headers=headers_b)
        assert res_b.status_code == 200
        docs_b = res_b.json()
        assert len(docs_b) == 0

        # 3. User B tries to fetch User A's document metadata -> 404 (ownership scoped)
        res_b_meta = client.get(f"/api/v1/documents/{doc_a_id}", headers=headers_b)
        assert res_b_meta.status_code == 404

        # 4. User B tries to stream User A's PDF file -> 404 (ownership scoped)
        res_b_file = client.get(f"/api/v1/documents/{doc_a_id}/file", headers=headers_b)
        assert res_b_file.status_code == 404

        # 5. User A search returns result
        search_a = client.get("/api/v1/search?q=financial%20strategy", headers=headers_a)
        assert search_a.status_code == 200
        assert len(search_a.json()) == 1

        # 6. User B search for same term -> returns 0 results (user isolation)
        search_b = client.get("/api/v1/search?q=financial%20strategy", headers=headers_b)
        assert search_b.status_code == 200
        assert len(search_b.json()) == 0

        # 7. User B RAG prompt -> returns fallback empty message (user isolation)
        rag_b = client.post("/api/v1/ask", json={"question": "What is the financial strategy?"}, headers=headers_b)
        assert rag_b.status_code == 200
        assert len(rag_b.json()["sources"]) == 0

    finally:
        db.delete(doc_a)
        db.delete(user_a)
        db.delete(user_b)
        db.commit()
        if os.path.exists(file_path_a):
            os.remove(file_path_a)
