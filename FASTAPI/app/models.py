from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import text

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    published = Column(Boolean, server_default="True", nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

    owner_id = Column(Integer, ForeignKey(("users.id"), ondelete="CASCADE"), nullable=False) 

    owner = relationship("User")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String, nullable=True, unique=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)  # New field
    last_name = Column(String, nullable=True)   # New field
    profile_picture = Column(String, nullable=True)  # New field for storing image URL
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))


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


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    event_date = Column(TIMESTAMP(timezone=True), nullable=False)
    location = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    
class EventLike(Base):
    __tablename__ = "event_likes"
    
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    
    # Create a unique constraint to prevent duplicate likes
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', name='unique_user_event_like'),
    )
    
    # Define relationships
    user = relationship("User")
    event = relationship("Event")
    
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, server_default="False", nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    
    # Define relationship
    user = relationship("User")


    

    