from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date, time
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

# class PostBase(BaseModel):
#     title: str
#     content: str
#     published: bool = True

# class Post(PostBase): # inherits from PostBase
#     id: int
#     created_at: datetime
#     owner_id: int
#     owner: UserOut

# class PostOut(PostBase):
#     Post: Post
#     votes: int

# class PostCreate(PostBase): # inherits from PostBase
#     pass

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
    profile_picture: Optional[str] = None  # Include profile picture
    relationship: str  # "none", "friends", "request_sent", "request_received"
    liked: bool
    friendshipId: Optional[int] = None
    hasLikedCurrentUser: bool
    recommended: Optional[bool] = False

class FriendshipOverview(BaseModel):
    id: int
    friend: dict  # Ideally, replace with a proper User schema
    status: str

class FriendsOverview(BaseModel):
    users: List[UserOverview]
    friends: List[FriendshipOverview]


# Add to FASTAPI/app/schemas.py
class Location(BaseModel):
    address: str
    lat: float
    lng: float

class EventBase(BaseModel):
    title: str
    description: str
    start_date: date
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    location: Location
    cover_photo_url: Optional[str] = None
    guest_limit: Optional[int] = None
    rsvp_close_time: Optional[datetime] = None
    visibility: str = Field('PUBLIC', pattern='^(PUBLIC|PRIVATE|FRIENDS)$')


class EventCreate(EventBase):
    """Schema for creating a new event."""
    pass


class EventResponse(EventBase):
    id: int
    creator_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventLikeResponse(BaseModel):
    user_id: int
    event_id: int
    liked_at: datetime

    class Config:
        from_attributes = True


class CreatorInfo(BaseModel):
    id: int
    username: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class EventLike(BaseModel):
    id: int
    user_id: int
    event_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class EventWithLikedUsers(EventResponse):
    liked_by_current_user: bool = False
    liked_by_friends: List[UserOut] = []
    creator: Optional[CreatorInfo] = None  # Add creator information
    
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

# Add these to FASTAPI/app/schemas.py

class InvitationTokenBase(BaseModel):
    description: str
    
class InvitationTokenCreate(InvitationTokenBase):
    expires_days: Optional[int] = 30

class InvitationTokenOut(InvitationTokenBase):
    id: int
    token: str
    created_by: int
    expires_at: datetime
    usage_count: int
    created_at: datetime
    
    class Config:
        orm_mode = True