"""Initial migration

Revision ID: b5c350ae7c41
Revises: 
Create Date: 2025-05-07 23:28:14.945312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5c350ae7c41'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### Create tables in proper dependency order ###
    
    # First, create the basic users table without the invitation_token_id
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('profile_picture', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    
    # Now create invitation_tokens which references users
    op.create_table('invitation_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('usage_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('session_token', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    
    # Add invitation_token_id to users as a separate step
    op.add_column('users',
        sa.Column('invitation_token_id', sa.Integer(), nullable=True)
    )
    
    # Add the foreign key constraint for invitation_token_id
    op.create_foreign_key(
        'fk_users_invitation_token_id', 'users', 'invitation_tokens',
        ['invitation_token_id'], ['id'], ondelete='SET NULL'
    )
    
    # Create the events table
    op.create_table('events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('start_time', sa.String(), nullable=False),
        sa.Column('end_time', sa.String(), nullable=True),
        sa.Column('place', sa.String(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create the friendships table
    op.create_table('friendships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('addressee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requester_id', 'addressee_id', name='unique_friendship')
    )
    
    # Create the notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='False', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create the posts table
    op.create_table('posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('published', sa.Boolean(), server_default='True', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create the event_likes table
    op.create_table('event_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'event_id', name='unique_user_event_like')
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in the reverse order of creation
    op.drop_table('event_likes')
    op.drop_table('posts')
    op.drop_table('notifications')
    op.drop_table('friendships')
    op.drop_table('events')
    
    # Remove foreign key constraint from users to invitation_tokens
    op.drop_constraint('fk_users_invitation_token_id', 'users', type_='foreignkey')
    op.drop_column('users', 'invitation_token_id')
    
    # Drop invitation_tokens
    op.drop_table('invitation_tokens')
    
    # Drop users
    op.drop_table('users')