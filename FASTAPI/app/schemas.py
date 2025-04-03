from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Annotated

# My pydantic models

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
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