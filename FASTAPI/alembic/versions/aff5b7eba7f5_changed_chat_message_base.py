"""changed chat message base

Revision ID: aff5b7eba7f5
Revises: 20048dfc1297
Create Date: 2025-07-18 15:16:53.503106

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'aff5b7eba7f5'
down_revision: Union[str, None] = '20048dfc1297'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Use this as your new migration content if you need to recreate it

def upgrade() -> None:
    """Upgrade schema."""
    # Only create the new event_messages table
    op.create_table('event_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('sent_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Drop the old chat_messages table (if it exists)
    try:
        op.drop_table('chat_messages')
    except:
        pass  # Table might not exist

def downgrade() -> None:
    """Downgrade schema."""
    # Just drop the event_messages table
    op.drop_table('event_messages')
