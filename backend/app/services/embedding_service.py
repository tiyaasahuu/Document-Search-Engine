import logging
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer

from app.models.document_chunk import DocumentChunk

logger = logging.getLogger(__name__)

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EXPECTED_EMBEDDING_DIM = 384


class EmbeddingServiceError(Exception):
    """Custom exception raised during embedding service operations."""
    pass


class EmbeddingService:
    _model: Optional[SentenceTransformer] = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """
        Singleton lazy loader for the SentenceTransformer model instance.
        """
        if cls._model is None:
            logger.info(f"Loading SentenceTransformer model '{EMBEDDING_MODEL_NAME}'...")
            try:
                cls._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
                logger.info(f"Successfully loaded '{EMBEDDING_MODEL_NAME}'.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model '{EMBEDDING_MODEL_NAME}': {e}")
                raise EmbeddingServiceError(f"Model initialization error: {e}")
        return cls._model

    @classmethod
    def generate_embedding(cls, text: Optional[str]) -> Optional[List[float]]:
        """
        Generates a 384-dimensional vector embedding for a given text string.
        Returns None if text is empty or whitespace-only.
        """
        if not text or not text.strip():
            return None

        cleaned_text = text.strip()
        model = cls.get_model()
        try:
            vector = model.encode(cleaned_text, convert_to_numpy=True)
            embedding_list = [float(val) for val in vector]
            if len(embedding_list) != EXPECTED_EMBEDDING_DIM:
                raise EmbeddingServiceError(
                    f"Unexpected embedding dimension {len(embedding_list)}, expected {EXPECTED_EMBEDDING_DIM}."
                )
            return embedding_list
        except EmbeddingServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to generate embedding for text: {e}")
            raise EmbeddingServiceError(f"Embedding generation failed: {e}")

    @classmethod
    def generate_embeddings_batch(cls, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Generates embeddings for a batch of text strings efficiently.
        Returns None for empty/whitespace strings.
        """
        results: List[Optional[List[float]]] = [None] * len(texts)
        valid_indices: List[int] = []
        valid_texts: List[str] = []

        for idx, text in enumerate(texts):
            if text and text.strip():
                valid_indices.append(idx)
                valid_texts.append(text.strip())

        if not valid_texts:
            return results

        model = cls.get_model()
        try:
            vectors = model.encode(valid_texts, convert_to_numpy=True, batch_size=32)
            for i, idx in enumerate(valid_indices):
                vec = [float(v) for v in vectors[i]]
                if len(vec) != EXPECTED_EMBEDDING_DIM:
                    raise EmbeddingServiceError(
                        f"Unexpected dimension {len(vec)} at index {idx}, expected {EXPECTED_EMBEDDING_DIM}."
                    )
                results[idx] = vec
            return results
        except EmbeddingServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise EmbeddingServiceError(f"Batch embedding generation failed: {e}")

    @classmethod
    def process_chunks_embeddings(
        cls,
        db: Session,
        chunks: List[DocumentChunk],
        force_reload: bool = False,
    ) -> List[DocumentChunk]:
        """
        Generates and stores embeddings for the provided DocumentChunk instances.
        Idempotent: skips chunks that already have non-null embeddings unless force_reload=True.
        Skips empty/whitespace chunks (embedding set to None).
        """
        if not chunks:
            return []

        chunks_to_process: List[DocumentChunk] = []
        texts_to_embed: List[str] = []
        chunk_indices_for_texts: List[int] = []

        for chunk in chunks:
            # Check if chunk needs embedding:
            # If embedding already exists and force_reload is False, skip to ensure idempotency.
            if chunk.embedding is not None and not force_reload:
                logger.debug(f"Chunk {chunk.id} already has embedding. Skipping generation.")
                continue

            chunks_to_process.append(chunk)
            if chunk.text and chunk.text.strip():
                texts_to_embed.append(chunk.text.strip())
                chunk_indices_for_texts.append(len(chunks_to_process) - 1)
            else:
                chunk.embedding = None

        if texts_to_embed:
            batch_embeddings = cls.generate_embeddings_batch(texts_to_embed)
            for text_i, chunk_i in enumerate(chunk_indices_for_texts):
                chunks_to_process[chunk_i].embedding = batch_embeddings[text_i]

            try:
                db.commit()
                for chunk in chunks_to_process:
                    db.refresh(chunk)
                logger.info(f"Successfully updated embeddings for {len(texts_to_embed)} chunks.")
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to commit chunk embeddings to database: {e}")
                raise EmbeddingServiceError(f"Database commit error: {e}")

        return chunks

    @classmethod
    def process_document_embeddings(
        cls,
        db: Session,
        document_id: uuid.UUID,
        force_reload: bool = False,
    ) -> List[DocumentChunk]:
        """
        Generates embeddings for all chunks belonging to a document.
        """
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        chunks = list(db.scalars(stmt).all())
        return cls.process_chunks_embeddings(db, chunks, force_reload=force_reload)

    @classmethod
    def process_unembedded_chunks(cls, db: Session) -> int:
        """
        Finds all DocumentChunks in the database where embedding is NULL and processes them.
        Returns the count of processed chunks.
        """
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.embedding == None)
            .order_by(DocumentChunk.created_at.asc())
        )
        unembedded_chunks = list(db.scalars(stmt).all())
        if not unembedded_chunks:
            logger.info("No unembedded chunks found in database.")
            return 0

        logger.info(f"Found {len(unembedded_chunks)} unembedded chunks in database. Generating embeddings...")
        cls.process_chunks_embeddings(db, unembedded_chunks, force_reload=False)
        return len(unembedded_chunks)
