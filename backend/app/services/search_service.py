import logging
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.search import SearchResultItem
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

MAX_SEARCH_LIMIT = 100


class SearchServiceError(Exception):
    """Exception raised for errors in the search service."""
    pass


class SearchService:
    @classmethod
    def search(
        cls,
        db: Session,
        query: str,
        current_user: User,
        limit: int = 10,
        document_id: Optional[uuid.UUID] = None,
    ) -> List[SearchResultItem]:
        """
        Performs semantic vector search across document_chunks strictly scoped to current user documents.
        """
        if not query or not query.strip():
            raise ValueError("Query string cannot be empty")

        if limit is None or limit < 1 or limit > MAX_SEARCH_LIMIT:
            raise ValueError(f"Limit must be between 1 and {MAX_SEARCH_LIMIT}")

        # If explicit document_id filter is specified, verify ownership
        if document_id is not None:
            doc = db.scalar(
                select(Document).where(
                    Document.id == document_id,
                    Document.user_id == current_user.id,
                )
            )
            if not doc:
                raise ValueError("Document not found or access denied")

        cleaned_query = query.strip()
        logger.info(f"Generating embedding for user {current_user.id} query: '{cleaned_query}'")

        query_vec = EmbeddingService.generate_embedding(cleaned_query)
        if query_vec is None:
            return []

        # Cosine distance operator in pgvector: DocumentChunk.embedding.cosine_distance(query_vec)
        cosine_dist_expr = DocumentChunk.embedding.cosine_distance(query_vec)
        similarity_expr = (1.0 - cosine_dist_expr).label("similarity_score")

        stmt = (
            select(DocumentChunk, similarity_expr, Document.original_filename)
            .join(Document, DocumentChunk.document_id == Document.id)
            .outerjoin(DocumentPage, DocumentChunk.page_id == DocumentPage.id)
            .where(
                DocumentChunk.embedding.is_not(None),
                Document.user_id == current_user.id,
            )
        )

        if document_id is not None:
            stmt = stmt.where(DocumentChunk.document_id == document_id)

        stmt = stmt.order_by(cosine_dist_expr.asc()).limit(limit)

        rows = db.execute(stmt).all()

        search_results: List[SearchResultItem] = []
        for chunk, score, orig_filename in rows:
            similarity_val = float(score) if score is not None else 0.0
            p_width = chunk.page.width if chunk.page else None
            p_height = chunk.page.height if chunk.page else None
            search_results.append(
                SearchResultItem(
                    document_id=chunk.document_id,
                    original_filename=orig_filename,
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    text=chunk.text,
                    chunk_text=chunk.text,
                    similarity_score=similarity_val,
                    similarity=similarity_val,
                    page_width=p_width,
                    page_height=p_height,
                    bboxes=chunk.bboxes,
                )
            )

        logger.info(f"User {current_user.id} search for '{cleaned_query}' returned {len(search_results)} results.")
        return search_results
