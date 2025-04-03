"""add content to post table

Revision ID: 3da859fcc295
Revises: ea6e1d4dd10d
Create Date: 2025-03-28 18:37:27.227086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3da859fcc295'
down_revision: Union[str, None] = 'ea6e1d4dd10d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('content', sa.String(), nullable=True))
    pass


def downgrade() -> None:
    op.drop_column('posts', 'content')
    pass
