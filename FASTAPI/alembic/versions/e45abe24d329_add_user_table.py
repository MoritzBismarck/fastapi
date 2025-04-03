"""add user table

Revision ID: e45abe24d329
Revises: 3da859fcc295
Create Date: 2025-03-28 18:42:49.963317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e45abe24d329'
down_revision: Union[str, None] = '3da859fcc295'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op. create_table('users', 
                     sa. Column ('id', sa. Integer(), nullable=False), 
                     sa. Column ( 'email', sa.String(), nullable=False), 
                     sa. Column ('password', sa.String(), nullable=False), 
                     sa. Column ('created_at', sa. TIMESTAMP (timezone=True), server_default=sa.text('now()'), nullable=False), 
                     sa. PrimaryKeyConstraint('id'), 
                     sa. UniqueConstraint ( 'email')
                     )
    pass


def downgrade() -> None:
    op.drop_table('users')
    pass
