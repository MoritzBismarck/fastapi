from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Annotated

# My pydantic models

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PostBase(BaseModel):
    title: str
    content: str
    published: bool = True

class Post(PostBase): # inherits from PostBase
    id: int
    created_at: datetime
    owner_id: int
    owner: UserOut

class PostOut(PostBase):
    Post: Post
    votes: int

class PostCreate(PostBase): # inherits from PostBase
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class Vote(BaseModel):
    post_id: int
    dir: Annotated[int, Field(le=1)] # direction of the vote

# Add to FASTAPI/app/schemas.py

class FriendshipBase(BaseModel):
    addressee_id: int

class FriendshipCreate(FriendshipBase):
    pass

class FriendshipUpdate(BaseModel):
    status: str

class FriendshipOut(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class FriendshipWithDetails(BaseModel):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    friend: UserOut  # This will be either the requester or addressee depending on context
    
    class Config:
        orm_mode = True