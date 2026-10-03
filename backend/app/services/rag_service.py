import logging
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from google import genai

from app.core.config import settings
from app.models.user import User
from app.schemas.rag import RAGResponse, RAGSourceItem
from app.services.search_service import SearchService, SearchServiceError

logger = logging.getLogger(__name__)

FALLBACK_NOT_FOUND_MSG = "The requested information could not be found in the uploaded documents."


class RAGServiceError(Exception):
    """Custom exception raised for RAG service failures."""
    pass


class RAGService:
    @classmethod
    def answer_question(
        cls,
        db: Session,
        question: str,
        current_user: User,
        limit: int = 5,
        document_id: Optional[uuid.UUID] = None,
    ) -> RAGResponse:
        """
        Generates a grounded RAG answer for a question using retrieved user-scoped document chunks and Gemini LLM.
        """
        if not question or not question.strip():
            raise ValueError("Question string cannot be empty")

        if limit is None or limit < 1 or limit > settings.RAG_MAX_RETRIEVAL_LIMIT:
            raise ValueError(f"Limit must be between 1 and {settings.RAG_MAX_RETRIEVAL_LIMIT}")

        cleaned_question = question.strip()
        logger.info(f"RAG question received from user {current_user.id}: '{cleaned_question}' (limit={limit}, doc_filter={document_id})")

        # 1. Retrieve top matching chunks using user-scoped semantic search service
        search_items = SearchService.search(
            db=db,
            query=cleaned_question,
            current_user=current_user,
            limit=limit,
            document_id=document_id,
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

        # 2. Handle empty search results gracefully without calling Gemini API
        if not sources:
            logger.info("No matching document chunks found. Returning fallback message.")
            return RAGResponse(
                question=cleaned_question,
                answer=FALLBACK_NOT_FOUND_MSG,
                sources=[],
            )

        # 3. Format retrieved context for grounded prompt
        context_blocks: List[str] = []
        for idx, src in enumerate(sources, start=1):
            context_blocks.append(
                f"[Excerpt {idx} | Document ID: {src.document_id} | Page: {src.page_number} | Chunk: {src.chunk_index}]\n"
                f"{src.text}"
            )
        formatted_context = "\n\n".join(context_blocks)

        prompt = (
            "You are an AI research assistant. Your task is to answer the user's question strictly using "
            "only the provided document context below.\n\n"
            "STRICT RULES:\n"
            "1. Answer ONLY based on facts directly mentioned in the document context.\n"
            "2. Do NOT use outside knowledge, speculation, or unverified assumptions.\n"
            "3. If the answer cannot be found or deduced from the provided context, clearly state: "
            f"'{FALLBACK_NOT_FOUND_MSG}'\n\n"
            f"DOCUMENT CONTEXT:\n{formatted_context}\n\n"
            f"USER QUESTION: {cleaned_question}\n\n"
            "ANSWER:"
        )

        # 4. Check Gemini API key configuration
        api_key = settings.GEMINI_API_KEY
        if not api_key or not api_key.strip():
            logger.error("Gemini API key is not configured in settings.")
            raise RAGServiceError("Gemini API key is not configured")

        # 5. Invoke Gemini API using Google Gen AI Python SDK
        try:
            logger.info(f"Calling Gemini API ({settings.GEMINI_MODEL})...")
            client = genai.Client(api_key=api_key.strip())
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )

            generated_answer = ""
            if response and hasattr(response, "text") and response.text:
                generated_answer = response.text.strip()

            if not generated_answer:
                generated_answer = FALLBACK_NOT_FOUND_MSG

            logger.info("Successfully generated RAG answer from Gemini.")
            return RAGResponse(
                question=cleaned_question,
                answer=generated_answer,
                sources=sources,
            )

        except RAGServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to generate answer from Gemini API: {e}")
            raise RAGServiceError(f"Gemini API error: {e}")
