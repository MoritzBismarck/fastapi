"""Add is_public to User

Revision ID: 496855faa98c
Revises: b5c350ae7c41
Create Date: 2025-07-07 09:11:07.976913

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '496855faa98c'
down_revision: Union[str, None] = 'b5c350ae7c41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('chat_sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_uuid', sa.String(), nullable=False),
    sa.Column('caretaker_id', sa.Integer(), nullable=False),
    sa.Column('helpseeker_id', sa.Integer(), nullable=False),
    sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.Column('ended_at', sa.TIMESTAMP(timezone=True), nullable=True),
    sa.Column('end_reason', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['caretaker_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['helpseeker_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('session_uuid')
    )
    op.add_column('users', sa.Column('is_public', sa.Boolean(), server_default='TRUE', nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'is_public')
    op.drop_table('chat_sessions')
    # ### end Alembic commands ###
