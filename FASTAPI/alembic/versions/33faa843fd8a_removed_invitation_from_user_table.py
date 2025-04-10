"""removed invitation from user table

Revision ID: 33faa843fd8a
Revises: 34c0026c3433
Create Date: 2025-04-03 18:01:06.772241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33faa843fd8a'
down_revision: Union[str, None] = '34c0026c3433'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('users_invitation_token_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'role')
    op.drop_column('users', 'invitation_token_id')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('invitation_token_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('role', sa.VARCHAR(), server_default=sa.text("'user'::character varying"), autoincrement=False, nullable=False))
    op.create_foreign_key('users_invitation_token_id_fkey', 'users', 'invitation_tokens', ['invitation_token_id'], ['id'])
    # ### end Alembic commands ###
