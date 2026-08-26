"""Add vector column and HNSW index to document_chunks

Revision ID: b5e710291a82
Revises: a3f89e2170b1
Create Date: 2026-08-26 08:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = 'b5e710291a82'
down_revision: Union[str, Sequence[str], None] = 'a3f89e2170b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: Ensure vector extension is installed in PostgreSQL
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # Step 2: Add nullable embedding column of type vector(384)
    op.add_column('document_chunks', sa.Column('embedding', Vector(384), nullable=True))

    # Step 3: Create HNSW index for cosine distance vector similarity
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw "
        "ON document_chunks USING hnsw (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw;")
    op.drop_column('document_chunks', 'embedding')
