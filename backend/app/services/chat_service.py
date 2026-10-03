import json
import logging
import uuid
from typing import Generator, List, Optional
from google import genai
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.conversation import Conversation, Message
from app.models.document import Document
from app.models.user import User
from app.schemas.chat import ConversationResponse, MessageResponse
from app.schemas.rag import RAGSourceItem
from app.services.rag_service import FALLBACK_NOT_FOUND_MSG
from app.services.search_service import SearchService

logger = logging.getLogger(__name__)


class ChatServiceError(Exception):
    """Custom exception raised for Chat service failures."""
    pass


class ChatService:
    @classmethod
    def get_user_conversation(cls, db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID) -> Conversation:
        """
        Retrieves a conversation by ID, enforcing user isolation.
        Raises ValueError if conversation is not found or does not belong to the user.
        """
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        conversation = db.scalar(stmt)
        if not conversation:
            logger.warning(f"User {user_id} attempted to access invalid or unauthorized conversation {conversation_id}")
            raise ValueError("Conversation not found")
        return conversation

    @classmethod
    def list_user_conversations(cls, db: Session, current_user: User) -> List[ConversationResponse]:
        """
        Lists all conversations for the authenticated user ordered by updated_at descending.
        """
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == current_user.id)
            .order_by(Conversation.updated_at.desc())
        )
        conversations = db.scalars(stmt).all()

        results = []
        for conv in conversations:
            # Fetch last message snippet
            last_msg_stmt = (
                select(Message.content)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg_text = db.scalar(last_msg_stmt)

            conv_resp = ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                title=conv.title,
                document_id=conv.document_id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                last_message=last_msg_text,
            )
            results.append(conv_resp)

        return results

    @classmethod
    def create_conversation(
        cls,
        db: Session,
        current_user: User,
        title: Optional[str] = "New Conversation",
        document_id: Optional[uuid.UUID] = None,
    ) -> Conversation:
        """
        Creates a new conversation for the authenticated user.
        If document_id is specified, verifies document ownership.
        """
        if document_id:
            doc_stmt = select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id,
            )
            doc = db.scalar(doc_stmt)
            if not doc:
                raise ValueError("Document not found")

        conv = Conversation(
            user_id=current_user.id,
            title=title or "New Conversation",
            document_id=document_id,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @classmethod
    def update_conversation(
        cls,
        db: Session,
        conversation_id: uuid.UUID,
        current_user: User,
        title: Optional[str] = None,
        document_id: Optional[uuid.UUID] = None,
    ) -> Conversation:
        """
        Updates title or document_id of a user conversation.
        """
        conv = cls.get_user_conversation(db, conversation_id, current_user.id)

        if document_id is not None:
            doc_stmt = select(Document).where(
                Document.id == document_id,
                Document.user_id == current_user.id,
            )
            doc = db.scalar(doc_stmt)
            if not doc:
                raise ValueError("Document not found")
            conv.document_id = document_id

        if title is not None and title.strip():
            conv.title = title.strip()

        conv.updated_at = func.now()
        db.commit()
        db.refresh(conv)
        return conv

    @classmethod
    def delete_conversation(cls, db: Session, conversation_id: uuid.UUID, current_user: User) -> None:
        """
        Deletes a user conversation and its messages.
        """
        conv = cls.get_user_conversation(db, conversation_id, current_user.id)
        db.delete(conv)
        db.commit()

    @classmethod
    def get_conversation_history(
        cls,
        db: Session,
        conversation_id: uuid.UUID,
        current_user: User,
        limit_turns: Optional[int] = None,
    ) -> List[Message]:
        """
        Retrieves message history for a conversation, enforced by user isolation.
        """
        conv = cls.get_user_conversation(db, conversation_id, current_user.id)
        stmt = (
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
        )
        messages = db.scalars(stmt).all()
        if limit_turns and len(messages) > limit_turns:
            return messages[-limit_turns:]
        return messages

    @classmethod
    def build_reformulated_search_query(
        cls,
        history_messages: List[Message],
        latest_message: str,
    ) -> str:
        """
        Builds a contextualized vector search query incorporating recent conversation history turns.
        """
        if not history_messages:
            return latest_message

        recent_context_parts = []
        for msg in history_messages[-4:]:
            role_prefix = "User" if msg.role == "user" else "Assistant"
            recent_context_parts.append(f"{role_prefix}: {msg.content}")

        context_summary = " ".join(recent_context_parts)
        # Combine user's latest query with context window summary
        return f"{latest_message} Context: {context_summary}"

    @classmethod
    def stream_chat_response(
        cls,
        db: Session,
        current_user: User,
        message_text: str,
        conversation_id: Optional[uuid.UUID] = None,
        document_id: Optional[uuid.UUID] = None,
        limit: int = 5,
    ) -> Generator[str, None, None]:
        """
        SSE Generator yielding structured JSON events ('conversation', 'sources', 'token', 'done', 'error')
        while streaming Gemini RAG response.
        Persists User message BEFORE generation and Assistant message ONLY AFTER completion.
        """
        try:
            cleaned_message = message_text.strip()
            if not cleaned_message:
                yield f"data: {json.dumps({'type': 'error', 'detail': 'Message cannot be empty'})}\n\n"
                return

            # 1. Obtain or create Conversation
            if conversation_id:
                try:
                    conv = cls.get_user_conversation(db, conversation_id, current_user.id)
                except ValueError as ve:
                    yield f"data: {json.dumps({'type': 'error', 'detail': str(ve)})}\n\n"
                    return
            else:
                title_snippet = cleaned_message[:30] + ("..." if len(cleaned_message) > 30 else "")
                conv = cls.create_conversation(db, current_user, title=title_snippet, document_id=document_id)
                yield f"data: {json.dumps({'type': 'conversation', 'conversation_id': str(conv.id), 'title': conv.title})}\n\n"

            # 2. Determine effective document filter & validate ownership if specified
            effective_doc_id = document_id or conv.document_id
            if effective_doc_id:
                doc_stmt = select(Document).where(
                    Document.id == effective_doc_id,
                    Document.user_id == current_user.id,
                )
                doc = db.scalar(doc_stmt)
                if not doc:
                    yield f"data: {json.dumps({'type': 'error', 'detail': 'Document not found'})}\n\n"
                    return

            # 3. Retrieve prior message history for context windowing
            history_messages = cls.get_conversation_history(
                db, conv.id, current_user, limit_turns=settings.CHAT_MAX_HISTORY_TURNS
            )

            # 4. SAVE USER MESSAGE BEFORE BEGINNING GENERATION
            user_msg = Message(
                conversation_id=conv.id,
                role="user",
                content=cleaned_message,
            )
            db.add(user_msg)
            conv.updated_at = func.now()
            db.commit()
            db.refresh(user_msg)

            # 5. Reformulate search query using history context & retrieve document chunks
            search_query = cls.build_reformulated_search_query(history_messages, cleaned_message)
            search_items = SearchService.search(
                db=db,
                query=search_query,
                current_user=current_user,
                limit=limit,
                document_id=effective_doc_id,
            )

            sources: List[RAGSourceItem] = [
                RAGSourceItem(
                    document_id=item.document_id,
                    original_filename=item.original_filename,
                    page_number=item.page_number,
                    chunk_index=item.chunk_index,
                    text=item.text,
                    similarity_score=item.similarity_score,
                    page_width=item.page_width,
                    page_height=item.page_height,
                    bboxes=item.bboxes,
                )
                for item in search_items
            ]

            sources_json = [src.model_dump(mode="json") for src in sources]
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources_json})}\n\n"

            # 6. Handle empty search results gracefully
            if not sources:
                accumulated_answer = FALLBACK_NOT_FOUND_MSG
                yield f"data: {json.dumps({'type': 'token', 'content': accumulated_answer})}\n\n"

                assistant_msg = Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content=accumulated_answer,
                    sources=[],
                )
                db.add(assistant_msg)
                conv.updated_at = func.now()
                db.commit()
                db.refresh(assistant_msg)

                yield f"data: {json.dumps({'type': 'done', 'message_id': str(assistant_msg.id), 'conversation_id': str(conv.id)})}\n\n"
                return

            # 7. Check Gemini API key configuration
            api_key = settings.GEMINI_API_KEY
            if not api_key or not api_key.strip():
                logger.error("Gemini API key is not configured.")
                yield f"data: {json.dumps({'type': 'error', 'detail': 'Gemini API key is not configured'})}\n\n"
                return

            # 8. Build Grounded Prompt with Document Context & Conversation History
            context_blocks: List[str] = []
            for idx, src in enumerate(sources, start=1):
                context_blocks.append(
                    f"[Excerpt {idx} | Document ID: {src.document_id} | Page: {src.page_number} | Chunk: {src.chunk_index}]\n"
                    f"{src.text}"
                )
            formatted_context = "\n\n".join(context_blocks)

            history_turns_formatted = ""
            if history_messages:
                history_turns = []
                for msg in history_messages:
                    role_lbl = "User" if msg.role == "user" else "Assistant"
                    history_turns.append(f"{role_lbl}: {msg.content}")
                history_turns_formatted = "PREVIOUS CONVERSATION HISTORY:\n" + "\n".join(history_turns) + "\n\n"

            prompt = (
                "You are an AI research assistant. Your task is to answer the user's question strictly using "
                "only the provided document context below.\n\n"
                "STRICT RULES:\n"
                "1. Answer ONLY based on facts directly mentioned in the document context.\n"
                "2. Do NOT use outside knowledge, speculation, or unverified assumptions.\n"
                "3. If the answer cannot be found or deduced from the provided context, clearly state: "
                f"'{FALLBACK_NOT_FOUND_MSG}'\n\n"
                f"{history_turns_formatted}"
                f"DOCUMENT CONTEXT:\n{formatted_context}\n\n"
                f"USER QUESTION: {cleaned_message}\n\n"
                "ANSWER:"
            )

            # 9. Invoke Gemini Streaming API & Accumulate Answer
            client = genai.Client(api_key=api_key.strip())
            response_stream = client.models.generate_content_stream(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )

            accumulated_answer = ""
            for chunk in response_stream:
                if chunk and hasattr(chunk, "text") and chunk.text:
                    token_text = chunk.text
                    accumulated_answer += token_text
                    yield f"data: {json.dumps({'type': 'token', 'content': token_text})}\n\n"

            if not accumulated_answer.strip():
                accumulated_answer = FALLBACK_NOT_FOUND_MSG
                yield f"data: {json.dumps({'type': 'token', 'content': accumulated_answer})}\n\n"

            # 10. PERSIST ASSISTANT MESSAGE ONLY AFTER SUCCESSFUL STREAM COMPLETION
            assistant_msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=accumulated_answer.strip(),
                sources=sources_json,
            )
            db.add(assistant_msg)
            conv.updated_at = func.now()
            db.commit()
            db.refresh(assistant_msg)

            yield f"data: {json.dumps({'type': 'done', 'message_id': str(assistant_msg.id), 'conversation_id': str(conv.id)})}\n\n"

        except Exception as e:
            logger.error(f"Error during Gemini chat streaming: {e}")
            yield f"data: {json.dumps({'type': 'error', 'detail': f'Streaming error: {str(e)}'})}\n\n"
