import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatStreamRequest,
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageResponse,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Conversations",
    tags=["Conversations"],
)
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all conversation threads owned by the authenticated user, ordered by updated_at desc.
    """
    return ChatService.list_user_conversations(db=db, current_user=current_user)


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Conversation",
    tags=["Conversations"],
)
def create_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new conversation thread for the authenticated user.
    """
    try:
        conv = ChatService.create_conversation(
            db=db,
            current_user=current_user,
            title=body.title,
            document_id=body.document_id,
        )
        return ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            document_id=conv.document_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            last_message=None,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Conversation Detail",
    tags=["Conversations"],
)
def get_conversation_detail(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves detailed information and full message history for a user-isolated conversation.
    """
    try:
        conv = ChatService.get_user_conversation(db, conversation_id, current_user.id)
        messages = ChatService.get_conversation_history(db, conv.id, current_user)

        msg_responses = [
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                sources=m.sources,
                created_at=m.created_at,
            )
            for m in messages
        ]

        last_msg = msg_responses[-1].content if msg_responses else None

        return ConversationDetailResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            document_id=conv.document_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            last_message=last_msg,
            messages=msg_responses,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Conversation",
    tags=["Conversations"],
)
def update_conversation(
    conversation_id: uuid.UUID,
    body: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates conversation title or document filter for the authenticated user.
    """
    try:
        conv = ChatService.update_conversation(
            db=db,
            conversation_id=conversation_id,
            current_user=current_user,
            title=body.title,
            document_id=body.document_id,
        )
        return ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            document_id=conv.document_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            last_message=None,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Conversation",
    tags=["Conversations"],
)
def delete_conversation(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a user-owned conversation and all associated messages.
    """
    try:
        ChatService.delete_conversation(db, conversation_id, current_user)
        return None
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post(
    "/conversations/stream",
    status_code=status.HTTP_200_OK,
    summary="Stream Chat Response (SSE)",
    tags=["Conversations"],
)
def stream_chat_response(
    body: ChatStreamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Streams Gemini RAG answer tokens over Server-Sent Events (SSE) media_type="text/event-stream".
    Events emitted:
      - conversation: {"type": "conversation", "conversation_id": "...", "title": "..."}
      - sources: {"type": "sources", "sources": [...]}
      - token: {"type": "token", "content": "..."}
      - done: {"type": "done", "message_id": "...", "conversation_id": "..."}
      - error: {"type": "error", "detail": "..."}
    """
    event_generator = ChatService.stream_chat_response(
        db=db,
        current_user=current_user,
        message_text=body.message,
        conversation_id=body.conversation_id,
        document_id=body.document_id,
        limit=body.limit,
    )
    return StreamingResponse(event_generator, media_type="text/event-stream")
