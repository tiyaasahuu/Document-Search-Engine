"""Add users table and user_id ownership to documents

Revision ID: d9a1f72e38c4
Revises: b5e710291a82
Create Date: 2026-09-01 23:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd9a1f72e38c4'
down_revision: Union[str, Sequence[str], None] = 'b5e710291a82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add users table and user_id to documents."""
    # Step 1: Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Step 2: Add nullable user_id column to documents
    op.add_column('documents', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Step 3: Safely populate default system user for pre-existing documents if any exist
    op.execute(
        "INSERT INTO users (id, email, hashed_password, full_name, created_at) "
        "SELECT '00000000-0000-0000-0000-000000000000', 'system@documind.ai', '$2b$12$eImiTXuWVxfM37uY4JANjO5E/x./.123456789012345678901', 'System Default User', NOW() "
        "WHERE EXISTS (SELECT 1 FROM documents WHERE user_id IS NULL) "
        "ON CONFLICT (id) DO NOTHING;"
    )
    op.execute(
        "UPDATE documents SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;"
    )

    # Step 4: Make user_id non-nullable, add foreign key constraint and index
    op.alter_column('documents', 'user_id', nullable=False)
    op.create_foreign_key(
        'fk_documents_user_id_users',
        'documents',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index('ix_documents_user_id', 'documents', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_documents_user_id', table_name='documents')
    op.drop_constraint('fk_documents_user_id_users', 'documents', type_='foreignkey')
    op.drop_column('documents', 'user_id')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
