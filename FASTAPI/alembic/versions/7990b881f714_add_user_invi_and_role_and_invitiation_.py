"""add User Invi and role and invitiation token base

Revision ID: 7990b881f714
Revises: 661b8b84f921
Create Date: 2025-04-03 16:22:27.482941

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7990b881f714'
down_revision: Union[str, None] = '661b8b84f921'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('invitation_tokens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('token', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('is_used', sa.Boolean(), server_default='False', nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token')
    )
    op.add_column('users', sa.Column('invitation_token_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('role', sa.String(), server_default='user', nullable=False))
    op.create_foreign_key(None, 'users', 'invitation_tokens', ['invitation_token_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_column('users', 'role')
    op.drop_column('users', 'invitation_token_id')
    op.drop_table('invitation_tokens')
    # ### end Alembic commands ###
