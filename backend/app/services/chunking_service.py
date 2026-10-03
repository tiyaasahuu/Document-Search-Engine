import logging
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_chunk import DocumentChunk

logger = logging.getLogger(__name__)


class ChunkingServiceError(Exception):
    """Custom exception raised during chunking service operations."""
    pass


class ChunkingService:
    @staticmethod
    def split_text_into_chunks(
        text: str,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[str]:
        """
        Splits text into chunks using a sliding window algorithm.
        
        :param text: Text content to chunk.
        :param chunk_size: Max characters per chunk (defaults to settings.CHUNK_SIZE).
        :param chunk_overlap: Overlap characters between consecutive chunks (defaults to settings.CHUNK_OVERLAP).
        :return: List of text chunk strings.
        """
        if not text or not text.strip():
            return []

        size = chunk_size if chunk_size is not None else settings.CHUNK_SIZE
        overlap = chunk_overlap if chunk_overlap is not None else settings.CHUNK_OVERLAP

        # Safety bounds
        if size <= 0:
            raise ValueError(f"chunk_size must be positive, got {size}")
        if overlap < 0:
            overlap = 0
        if overlap >= size:
            overlap = size - 1

        step = max(1, size - overlap)
        text_len = len(text)
        chunks = []
        start = 0

        while start < text_len:
            end = min(start + size, text_len)
            chunk = text[start:end]
            if chunk:
                chunks.append(chunk)
            if end == text_len:
                break
            start += step

        return chunks

    @classmethod
    def process_document_chunking(
        cls,
        db: Session,
        document_id: uuid.UUID,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[DocumentChunk]:
        """
        Generates text chunks for all pages of a document and persists them to the DB.
        Idempotent: Re-processing the same document replaces existing chunks cleanly.
        
        :param db: SQLAlchemy Session.
        :param document_id: UUID of the target Document.
        :param chunk_size: Optional chunk size override.
        :param chunk_overlap: Optional chunk overlap override.
        :return: List of created DocumentChunk instances.
        """
        try:
            # Query pages ordered by page_number
            stmt = (
                select(DocumentPage)
                .where(DocumentPage.document_id == document_id)
                .order_by(DocumentPage.page_number.asc())
            )
            pages = list(db.scalars(stmt).all())

            if not pages:
                logger.warning(f"No pages found for document_id {document_id} during chunking.")
                # Idempotent cleanup if existing chunks were somehow present
                db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
                db.commit()
                return []

            # Idempotency step: clear existing chunks for this document
            db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

            chunk_objects: List[DocumentChunk] = []
            global_chunk_index = 0

            for page in pages:
                page_text_chunks = cls.split_text_into_chunks(
                    text=page.text,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                )
                for chunk_text in page_text_chunks:
                    chunk_bboxes = []
                    if page.blocks_data:
                        for block in page.blocks_data:
                            b_text = block.get("text", "")
                            if b_text and (b_text in chunk_text or chunk_text in b_text or any(w in b_text for w in chunk_text.split() if len(w) > 3)):
                                bbox = block.get("bbox")
                                if bbox and bbox not in chunk_bboxes:
                                    chunk_bboxes.append(bbox)

                    chunk_obj = DocumentChunk(
                        id=uuid.uuid4(),
                        document_id=document_id,
                        page_id=page.id,
                        page_number=page.page_number,
                        chunk_index=global_chunk_index,
                        text=chunk_text,
                        bboxes=chunk_bboxes if chunk_bboxes else None,
                    )
                    chunk_objects.append(chunk_obj)
                    global_chunk_index += 1

            if chunk_objects:
                db.add_all(chunk_objects)

            db.commit()
            for chunk in chunk_objects:
                db.refresh(chunk)

            logger.info(
                f"Successfully created {len(chunk_objects)} text chunks for document_id {document_id}."
            )
            return chunk_objects

        except Exception as e:
            db.rollback()
            logger.error(f"Error during chunking execution for document_id {document_id}: {e}")
            raise ChunkingServiceError(f"Failed to create chunks for document {document_id}: {e}")
