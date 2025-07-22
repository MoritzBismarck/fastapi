from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, UniqueConstraint, Date, Time, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy.dialects.postgresql import ENUM

# Enums for controlled vocabularies
event_visibility = ENUM('PUBLIC', 'PRIVATE', 'FRIENDS', name='event_visibility', create_type=False)
event_status     = ENUM('ACTIVE', 'CANCELLED', 'DELETED', name='event_status', create_type=False)
rsvp_status      = ENUM('INTERESTED', 'GOING', 'CANCELLED', name='rsvp_status', create_type=False)
match_context    = Enum('PUBLIC', 'PRIVATE', 'FRIENDS', name='match_context', create_type=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=True, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

    # REMOVED CIRCULAR DEPENDENCY - no invitation_token_id column
    # invitation_token_id = Column(Integer, ForeignKey("invitation_tokens.id", ondelete="SET NULL"), nullable=True)
    invitation_token_id = Column(Integer, ForeignKey("invitation_tokens.id", ondelete="SET NULL"), nullable=True)
    
    is_public = Column(Boolean, nullable=False, server_default="FALSE") 

    # Relationships
    created_events = relationship('Event', back_populates='creator')
    likes = relationship('EventLike', back_populates='user')
    rsvps = relationship('RSVP', back_populates='user')
    matches = relationship('MatchParticipant', back_populates='user')
    feature_votes = relationship('FeatureVote', back_populates='user')
    comment_likes = relationship('CommentLike', back_populates='user')
    comment_reply_likes = relationship('CommentReplyLike', back_populates='user')
    
    # Invitation tokens created by this user (not used by this user)
    invitation_token = relationship("InvitationToken", foreign_keys=[invitation_token_id], post_update=True)

class Friendship(Base):
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    addressee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)  # "pending", "accepted", "rejected"
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"), onupdate=text("now()"))
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_friendships")
    addressee = relationship("User", foreign_keys=[addressee_id], backref="received_friendships")
    
    # Ensure a user can't send multiple requests to the same person
    __table_args__ = (
        UniqueConstraint('requester_id', 'addressee_id', name='unique_friendship'),
    )

class InvitationToken(Base):
    __tablename__ = "invitation_tokens"
    id = Column(Integer, primary_key=True, nullable=False)
    token = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    usage_count = Column(Integer, server_default="0", nullable=False)  # Track number of uses
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Made nullable for first admin
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    session_token = Column(String, nullable=True)
    
    # REMOVED CIRCULAR DEPENDENCY - no invited_users relationship
    # invited_users = relationship("User", foreign_keys="User.invitation_token_id", back_populates="invitation_token")
    
    # Keep creator relationship (this direction is fine)
    creator = relationship("User", foreign_keys=[created_by], backref="created_invitation_tokens")

# OPTIONAL: If you need to track which invitation was used by which user
class UserInvitation(Base):
    __tablename__ = "user_invitations"
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitation_token_id = Column(Integer, ForeignKey("invitation_tokens.id", ondelete="CASCADE"), nullable=False)
    used_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    
    user = relationship("User", backref="used_invitations")
    invitation_token = relationship("InvitationToken", backref="user_usages")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'invitation_token_id', name='uc_user_invitation'),
    )

class Event(Base):
    __tablename__ = 'events'

    id               = Column(Integer, primary_key=True, nullable=False)
    title            = Column(String, nullable=False)
    description      = Column(String, nullable=False)

    # Visibility and lifecycle
    visibility       = Column(event_visibility, nullable=False, server_default='PUBLIC')
    status           = Column(event_status,     nullable=False, server_default='ACTIVE')

    # Timing
    start_date       = Column(Date, nullable=False)
    end_date         = Column(Date, nullable=True)
    start_time       = Column(Time, nullable=True)
    end_time         = Column(Time, nullable=True)
    rsvp_close_time  = Column(TIMESTAMP(timezone=True), nullable=True)

    # Location & media
    location         = Column(String, nullable=False)
    cover_photo_url  = Column(String, nullable=True)

    # Capacity & counts
    guest_limit      = Column(Integer, nullable=True)
    interested_count = Column(Integer, nullable=False, server_default='0')
    going_count      = Column(Integer, nullable=False, server_default='0')

    # Audit
    created_at       = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    updated_at       = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))
    last_edited_at   = Column(TIMESTAMP(timezone=True), nullable=True)

    # Ownership
    creator_id       = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    creator          = relationship('User', back_populates='created_events')
    
    # CASCADE RELATIONSHIPS - These ensure proper deletion
    event_likes      = relationship('EventLike', back_populates='event', cascade='all, delete-orphan')
    event_rsvps      = relationship('RSVP', back_populates='event', cascade='all, delete-orphan')
    event_matches    = relationship('Match', back_populates='event', cascade='all, delete-orphan')
    event_messages   = relationship('EventMessage', back_populates='event', cascade='all, delete-orphan')
    event_edits      = relationship('EventEdit', back_populates='event', cascade='all, delete-orphan')

class EventLike(Base):
    __tablename__ = 'event_likes'
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', name='uc_like_user_event'),
    )

    user_id   = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    event_id  = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), primary_key=True)
    liked_at  = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user      = relationship('User', back_populates='likes')
    event     = relationship('Event', back_populates='event_likes')
    
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, server_default="False", nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    
    # Define relationship
    user = relationship("User")

class RSVP(Base):
    __tablename__ = 'rsvps'
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', name='uc_rsvp_user_event'),
    )

    user_id      = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    event_id     = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), primary_key=True)
    status       = Column(rsvp_status, nullable=False, server_default='GOING')
    responded_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user         = relationship('User', back_populates='rsvps')
    event        = relationship('Event', back_populates='event_rsvps')

class Match(Base):
    __tablename__ = 'matches'

    id                = Column(Integer, primary_key=True, nullable=False)
    event_id          = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    context           = Column(match_context, nullable=False, server_default='PUBLIC')
    created_at        = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    last_message_at   = Column(TIMESTAMP(timezone=True), nullable=True)

    event             = relationship('Event', back_populates='event_matches')
    participants      = relationship('MatchParticipant', back_populates='match', cascade='all, delete-orphan')

class MatchParticipant(Base):
    __tablename__ = 'match_participants'
    __table_args__ = (
        UniqueConstraint('match_id', 'user_id', name='uc_match_participant'),
    )

    match_id     = Column(Integer, ForeignKey('matches.id', ondelete='CASCADE'), primary_key=True)
    user_id      = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    joined_at    = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    unread_count = Column(Integer, nullable=False, server_default='0')

    match        = relationship('Match', back_populates='participants')
    user         = relationship('User', back_populates='matches')

class EventMessage(Base):
    __tablename__ = 'event_messages'

    id           = Column(Integer, primary_key=True, nullable=False)
    event_id     = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    sender_id    = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content      = Column(String, nullable=False)
    sent_at      = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    event        = relationship('Event', back_populates='event_messages')
    sender       = relationship('User', backref='event_messages')

class EventEdit(Base):
    __tablename__ = 'event_edits'

    id             = Column(Integer, primary_key=True, nullable=False)
    event_id       = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    editor_id      = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    changed_fields = Column(String, nullable=False)  # simplified to text: e.g. 'time=20:00'
    created_at     = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    event          = relationship('Event', back_populates='event_edits')
    editor         = relationship('User')

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, nullable=False)
    session_uuid = Column(String, nullable=False, unique=True)
    caretaker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    helpseeker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), nullable=False)
    ended_at = Column(TIMESTAMP(timezone=True), nullable=True)
    end_reason = Column(String, nullable=True)  # 'timeout', 'disconnect'
    
    # Relationships
    caretaker = relationship("User", foreign_keys=[caretaker_id])
    helpseeker = relationship("User", foreign_keys=[helpseeker_id])

class Feature(Base):
    __tablename__ = 'features'

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    vote_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))
    
    # Admin/creator who added this feature
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    # Relationships
    creator = relationship('User', backref='created_features')
    votes = relationship('FeatureVote', back_populates='feature', cascade='all, delete-orphan')

class FeatureVote(Base):
    __tablename__ = 'feature_votes'
    __table_args__ = (
        UniqueConstraint('user_id', 'feature_id', name='uc_feature_vote_user_feature'),
    )

    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    feature_id = Column(Integer, ForeignKey('features.id', ondelete='CASCADE'), primary_key=True)
    voted_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user = relationship('User', back_populates='feature_votes')
    feature = relationship('Feature', back_populates='votes')

# Comment System Models
class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, nullable=False)
    content = Column(String, nullable=False)
    like_count = Column(Integer, nullable=False, server_default='0')
    reply_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))
    
    # Author
    author_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Relationships
    author = relationship('User', backref='comments')
    replies = relationship('CommentReply', back_populates='comment', cascade='all, delete-orphan')
    likes = relationship('CommentLike', back_populates='comment', cascade='all, delete-orphan')

class CommentReply(Base):
    __tablename__ = 'comment_replies'

    id = Column(Integer, primary_key=True, nullable=False)
    content = Column(String, nullable=False)
    like_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'), onupdate=text('now()'))
    
    # Parent comment
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), nullable=False)
    
    # Author
    author_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Relationships
    comment = relationship('Comment', back_populates='replies')
    author = relationship('User', backref='comment_replies')
    likes = relationship('CommentReplyLike', back_populates='reply', cascade='all, delete-orphan')

class CommentLike(Base):
    __tablename__ = 'comment_likes'
    __table_args__ = (
        UniqueConstraint('user_id', 'comment_id', name='uc_comment_like_user_comment'),
    )

    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    comment_id = Column(Integer, ForeignKey('comments.id', ondelete='CASCADE'), primary_key=True)
    liked_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user = relationship('User', back_populates='comment_likes')
    comment = relationship('Comment', back_populates='likes')

class CommentReplyLike(Base):
    __tablename__ = 'comment_reply_likes'
    __table_args__ = (
        UniqueConstraint('user_id', 'reply_id', name='uc_reply_like_user_reply'),
    )

    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    reply_id = Column(Integer, ForeignKey('comment_replies.id', ondelete='CASCADE'), primary_key=True)
    liked_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text('now()'))

    user = relationship('User', back_populates='comment_reply_likes')
    reply = relationship('CommentReply', back_populates='likes')