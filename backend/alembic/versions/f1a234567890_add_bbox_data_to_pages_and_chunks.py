"""Add blocks_data to document_pages and bboxes to document_chunks

Revision ID: f1a234567890
Revises: e7f123456789
Create Date: 2026-09-26 23:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f1a234567890'
down_revision: Union[str, Sequence[str], None] = 'e7f123456789'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'document_pages',
        sa.Column('blocks_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )
    op.add_column(
        'document_chunks',
        sa.Column('bboxes', postgresql.JSONB(astext_type=sa.Text()), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('document_chunks', 'bboxes')
    op.drop_column('document_pages', 'blocks_data')
