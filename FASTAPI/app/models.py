from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
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
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))


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
    

    