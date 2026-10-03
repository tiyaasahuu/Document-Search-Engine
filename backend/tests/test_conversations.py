import json
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
from app.models.conversation import Conversation, Message
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_page import DocumentPage
from app.models.user import User
from app.services.chat_service import ChatService
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
def test_user1(db: Session):
    user = User(
        email=f"user1_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User One",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture
def test_user2(db: Session):
    user = User(
        email=f"user2_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User Two",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture
def auth_headers1(test_user1: User):
    token = create_access_token(test_user1.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers2(test_user2: User):
    token = create_access_token(test_user2.id)
    return {"Authorization": f"Bearer {token}"}


def test_conversation_crud_and_user_isolation(
    client: TestClient, db: Session, test_user1: User, test_user2: User, auth_headers1: dict, auth_headers2: dict
):
    """Verify CRUD endpoints and strict user isolation for conversations."""
    # 1. User 1 creates conversation
    create_resp = client.post(
        "/api/v1/conversations",
        json={"title": "User 1 Research Session"},
        headers=auth_headers1,
    )
    assert create_resp.status_code == 201
    conv_data = create_resp.json()
    conv_id = conv_data["id"]
    assert conv_data["title"] == "User 1 Research Session"

    # 2. User 1 lists conversations
    list_resp = client.get("/api/v1/conversations", headers=auth_headers1)
    assert list_resp.status_code == 200
    user1_convs = list_resp.json()
    assert len(user1_convs) == 1
    assert user1_convs[0]["id"] == conv_id

    # 3. User 2 lists conversations -> Should be empty (user isolation)
    user2_list = client.get("/api/v1/conversations", headers=auth_headers2)
    assert user2_list.status_code == 200
    assert len(user2_list.json()) == 0

    # 4. User 2 attempts to get User 1's conversation details -> 404 Not Found
    user2_get = client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers2)
    assert user2_get.status_code == 404

    # 5. User 1 gets conversation details
    user1_get = client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers1)
    assert user1_get.status_code == 200
    assert user1_get.json()["id"] == conv_id

    # 6. User 2 attempts to patch User 1's conversation -> 404 Not Found
    user2_patch = client.patch(
        f"/api/v1/conversations/{conv_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers2,
    )
    assert user2_patch.status_code == 404

    # 7. User 1 patches conversation title
    user1_patch = client.patch(
        f"/api/v1/conversations/{conv_id}",
        json={"title": "Updated User 1 Session"},
        headers=auth_headers1,
    )
    assert user1_patch.status_code == 200
    assert user1_patch.json()["title"] == "Updated User 1 Session"

    # 8. User 2 attempts to delete User 1's conversation -> 404 Not Found
    user2_del = client.delete(f"/api/v1/conversations/{conv_id}", headers=auth_headers2)
    assert user2_del.status_code == 404

    # 9. User 1 deletes conversation
    user1_del = client.delete(f"/api/v1/conversations/{conv_id}", headers=auth_headers1)
    assert user1_del.status_code == 204

    # Confirm deletion
    user1_check = client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers1)
    assert user1_check.status_code == 404


def test_document_filter_ownership_validation(
    client: TestClient, db: Session, test_user1: User, test_user2: User, auth_headers1: dict, auth_headers2: dict
):
    """Verify creating or filtering conversation with another user's document fails authorization."""
    # Create document owned by User 2
    doc2_id = uuid.uuid4()
    doc2 = Document(
        id=doc2_id,
        user_id=test_user2.id,
        filename=f"{doc2_id}.pdf",
        original_filename="user2_private.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc2_id}.pdf",
    )
    db.add(doc2)
    db.commit()

    try:
        # User 1 attempts to create conversation with User 2's document_id
        res = client.post(
            "/api/v1/conversations",
            json={"title": "Filtered Chat", "document_id": str(doc2_id)},
            headers=auth_headers1,
        )
        assert res.status_code == 404
        assert "Document not found" in res.json()["detail"]

    finally:
        db.delete(doc2)
        db.commit()


def test_chat_stream_sse_and_citation_persistence(
    client: TestClient, db: Session, test_user1: User, auth_headers1: dict, monkeypatch
):
    """Verify POST /api/v1/conversations/stream streams SSE events and persists user & assistant messages with citations."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user1.id,
        filename=f"{doc_id}.pdf",
        original_filename="quantum_paper.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Quantum mechanics explains physical phenomena at subatomic scales.",
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
        text="Quantum mechanics explains physical phenomena at subatomic scales including superposition and entanglement.",
        embedding=EmbeddingService.generate_embedding(
            "Quantum mechanics explains physical phenomena at subatomic scales including superposition and entanglement."
        ),
    )

    db.add_all([doc, page, chunk])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_api_key_stream_123")

    try:
        mock_chunk1 = MagicMock()
        mock_chunk1.text = "Quantum mechanics "
        mock_chunk2 = MagicMock()
        mock_chunk2.text = "governs subatomic physics."

        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content_stream.return_value = [mock_chunk1, mock_chunk2]
            mock_client_cls.return_value = mock_client_instance

            payload = {
                "message": "Explain quantum mechanics",
                "limit": 5,
            }
            response = client.post("/api/v1/conversations/stream", json=payload, headers=auth_headers1)
            assert response.status_code == 200
            assert "text/event-stream" in response.headers["content-type"]

            # Parse SSE lines
            content_text = response.text
            lines = [line.strip() for line in content_text.split("\n") if line.startswith("data: ")]

            event_types = []
            conversation_id = None
            for line in lines:
                data_json = json.loads(line[6:])
                event_types.append(data_json.get("type"))
                if data_json.get("type") == "conversation":
                    conversation_id = data_json.get("conversation_id")

            assert "conversation" in event_types
            assert "sources" in event_types
            assert "token" in event_types
            assert "done" in event_types

            # Verify persisted messages in database
            assert conversation_id is not None
            history_res = client.get(f"/api/v1/conversations/{conversation_id}", headers=auth_headers1)
            assert history_res.status_code == 200
            hist_data = history_res.json()
            messages = hist_data["messages"]
            assert len(messages) == 2
            assert messages[0]["role"] == "user"
            assert messages[0]["content"] == "Explain quantum mechanics"
            assert messages[1]["role"] == "assistant"
            assert messages[1]["content"] == "Quantum mechanics governs subatomic physics."
            assert len(messages[1]["sources"]) >= 1
            assert messages[1]["sources"][0]["document_id"] == str(doc_id)

    finally:
        db.delete(doc)
        db.commit()


def test_multi_turn_history_context_windowing(
    client: TestClient, db: Session, test_user1: User, auth_headers1: dict, monkeypatch
):
    """Verify follow-up question uses previous conversation context turns."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user1.id,
        filename=f"{doc_id}.pdf",
        original_filename="france_info.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Paris is known for its culture, gastronomy, and art.",
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
        text="Paris is known for its culture, gastronomy, and art.",
        embedding=EmbeddingService.generate_embedding("Paris is known for its culture, gastronomy, and art."),
    )
    db.add_all([doc, page, chunk])
    db.commit()

    conv = ChatService.create_conversation(db, test_user1, title="Multi-turn Test Session")

    # Add initial QA turn in history
    msg_u1 = Message(conversation_id=conv.id, role="user", content="What is the capital of France?")
    msg_a1 = Message(conversation_id=conv.id, role="assistant", content="The capital of France is Paris.")
    db.add_all([msg_u1, msg_a1])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_key")

    try:
        mock_chunk = MagicMock()
        mock_chunk.text = "Paris is known for its culture and art."
        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content_stream.return_value = [mock_chunk]
            mock_client_cls.return_value = mock_client_instance

            payload = {
                "message": "What is it known for?",
                "conversation_id": str(conv.id),
            }
            res = client.post("/api/v1/conversations/stream", json=payload, headers=auth_headers1)
            assert res.status_code == 200

            # Inspect prompt passed to generate_content_stream
            mock_client_instance.models.generate_content_stream.assert_called_once()
            called_kwargs = mock_client_instance.models.generate_content_stream.call_args[1]
            prompt_used = called_kwargs.get("contents", "")

            # Verify prompt contains prior history context
            assert "PREVIOUS CONVERSATION HISTORY:" in prompt_used
            assert "The capital of France is Paris" in prompt_used
            assert "What is it known for?" in prompt_used

    finally:
        db.delete(conv)
        db.delete(doc)
        db.commit()



def test_ask_backward_compatibility(
    client: TestClient, db: Session, test_user1: User, auth_headers1: dict, monkeypatch
):
    """Verify that original POST /api/v1/ask continues to work synchronously as before."""
    doc_id = uuid.uuid4()
    page_id = uuid.uuid4()

    doc = Document(
        id=doc_id,
        user_id=test_user1.id,
        filename=f"{doc_id}.pdf",
        original_filename="backward_compat.pdf",
        file_size=512,
        mime_type="application/pdf",
        status="Processed",
        file_path=f"uploads/{doc_id}.pdf",
    )
    page = DocumentPage(
        id=page_id,
        document_id=doc_id,
        page_number=1,
        text="Backward compatibility verification content.",
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
        text="Backward compatibility verification content text chunk.",
        embedding=EmbeddingService.generate_embedding("Backward compatibility verification content text chunk."),
    )

    db.add_all([doc, page, chunk])
    db.commit()

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_key")

    try:
        with patch("google.genai.Client") as mock_client_cls:
            mock_client_instance = MagicMock()
            mock_client_instance.models.generate_content.return_value = MagicMock(
                text="The /ask endpoint remains fully operational."
            )
            mock_client_cls.return_value = mock_client_instance

            payload = {
                "question": "Does /ask still work?",
                "limit": 3,
            }
            res = client.post("/api/v1/ask", json=payload, headers=auth_headers1)
            assert res.status_code == 200
            data = res.json()
            assert data["question"] == "Does /ask still work?"
            assert data["answer"] == "The /ask endpoint remains fully operational."
            assert len(data["sources"]) >= 1

    finally:
        db.delete(doc)
        db.commit()
