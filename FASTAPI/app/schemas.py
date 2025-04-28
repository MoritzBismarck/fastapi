from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Annotated

# My pydantic models

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None

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

class UserOverview(BaseModel):
    id: int
    username: str
    email: EmailStr
    relationship: str  # "none", "friends", "request_sent", "request_received"
    liked: bool
    friendshipId: Optional[int] = None
    hasLikedCurrentUser: bool

class FriendshipOverview(BaseModel):
    id: int
    friend: dict  # Ideally, replace with a proper User schema
    status: str

class FriendsOverview(BaseModel):
    users: List[UserOverview]
    friends: List[FriendshipOverview]


# Add to FASTAPI/app/schemas.py

class EventBase(BaseModel):
    title: str
    description: str
    start_date: datetime
    end_date: Optional[datetime] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: bool = False
    venue_name: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class EventLike(BaseModel):
    id: int
    user_id: int
    event_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class EventWithLikedUsers(Event):
    liked_by_current_user: bool = False
    liked_by_friends: List[UserOut] = []
    
    class Config:
        orm_mode = True

class NotificationBase(BaseModel):
    content: str

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        orm_mode = True