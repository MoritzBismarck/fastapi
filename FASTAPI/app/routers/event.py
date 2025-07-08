# Create a new file: FASTAPI/app/routers/event.py

from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, oauth2
from ..database import get_db
from ..services.notification_service import NotificationService
from sqlalchemy import and_, func, or_
import uuid
from ..services import storage_service

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.post("", status_code=status.HTTP_201_CREATED, response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Map Pydantic data to SQLAlchemy model
    event_data = event.model_dump()
    
    # Remove creator_id from event_data if it exists (we'll set it manually)
    event_data.pop('creator_id', None)
    
    # Create the event
    new_event = models.Event(
        **event_data,
        creator_id=current_user.id
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Automatically create a like for PRIVATE events (creator always likes their own private events)
    if current_user.is_public == 'FALSE':
        creator_like = models.EventLike(
            user_id=current_user.id,
            event_id=new_event.id
        )
        db.add(creator_like)
        db.commit()
        
        # Note: No need to call NotificationService.notify_event_match here
        # since it's the creator liking their own event
    
    return new_event

@router.post("/{event_id}/image", status_code=status.HTTP_200_OK, response_model=schemas.EventResponse)
async def upload_event_image(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Upload an image for an event"""
    
    # Check if the event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # Generate a unique filename
    original_filename = file.filename
    file_extension = original_filename.split(".")[-1] if "." in original_filename else "jpg"
    object_name = f"event-images/{event_id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        # Reset the file pointer to the beginning
        file.file.seek(0)
        # Upload the file to storage service
        storage_service.upload_fileobj(file.file, object_name)
        
        # Get the public URL
        file_url = storage_service.generate_file_url(object_name)
        
        # Update the event's image URL
        db.query(models.Event).filter(models.Event.id == event_id).update(
            {"image_url": file_url},
            synchronize_session=False
        )
        db.commit()
        
        # Return the updated event
        return db.query(models.Event).filter(models.Event.id == event_id).first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

@router.post("/upload/")
async def upload_file_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    """
    Endpoint for uploading a file.
    
    - Generates a unique filename using UUID.
    - Uses the storage service to upload the file directly to DigitalOcean Spaces.
    - Returns the public URL of the uploaded file.
    """
    # Generate a unique filename to avoid conflicts.
    # Keep the original file extension.
    original_filename = file.filename
    file_extension = original_filename.split(".")[-1] if "." in original_filename else "dat"
    object_name = f"{uuid.uuid4()}.{file_extension}"

    try:
        # Reset the file pointer to the beginning, if needed.
        file.file.seek(0)
        # Upload the file using the storage service
        storage_service.upload_fileobj(file.file, object_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    # Generate the accessible file URL after upload.
    file_url = storage_service.generate_file_url(object_name)
    return {"file_url": file_url}


@router.get("", response_model=List[schemas.EventWithLikedUsers])
def get_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 10,
    skip: int = 0,
    exclude_liked: bool = True,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
):
    # Base query for events
    query = db.query(models.Event)
    
    # Filter out events that aren't active
    query = query.filter(models.Event.status == 'ACTIVE')
    
    if exclude_liked:
        # Get IDs of events already liked by current user
        liked_event_ids = db.query(models.EventLike.event_id).filter(
            models.EventLike.user_id == current_user.id
        ).scalar_subquery()
        query = query.filter(models.Event.id.notin_(liked_event_ids))
    
    # Filter by visibility - only show PUBLIC events and PRIVATE events from friends
    # Get friend IDs first for PRIVATE event filtering
    friend_ids = []
    
    # Get friendships where user is requester
    requester_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    friend_ids.extend([f.addressee_id for f in requester_friendships])
    
    # Get friendships where user is addressee
    addressee_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.addressee_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    friend_ids.extend([f.requester_id for f in addressee_friendships])
    
    # Filter events by visibility
    query = query.filter(
        or_(
            models.Event.visibility == 'PUBLIC',
            and_(
                models.Event.visibility == 'PRIVATE',
                models.Event.creator_id.in_(friend_ids + [current_user.id])  # Include user's own private events
            ),
            and_(
                models.Event.visibility == 'FRIENDS',
                models.Event.creator_id.in_(friend_ids + [current_user.id])
            )
        )
    )
    
    # Filter by date range if provided
    if from_date:
        query = query.filter(models.Event.start_date >= from_date.date())
    if to_date:
        query = query.filter(
            or_(
                models.Event.end_date <= to_date.date(),
                and_(
                    models.Event.end_date.is_(None),
                    models.Event.start_date <= to_date.date()
                )
            )
        )
    
    # Get events with pagination, sorted by start_date
    events = query.order_by(models.Event.start_date).offset(skip).limit(limit).all()
    
    # For each event, get friends who liked it and creator info
    result = []
    for event in events:
        # Get users who have liked this event and are friends with current user
        friends_who_liked = db.query(models.User).join(
            models.EventLike,
            models.EventLike.user_id == models.User.id
        ).filter(
            and_(
                models.EventLike.event_id == event.id,
                models.User.id.in_(friend_ids)
            )
        ).all()
        
        # Check if current user has liked this event
        user_liked = db.query(models.EventLike).filter(
            and_(
                models.EventLike.user_id == current_user.id,
                models.EventLike.event_id == event.id
            )
        ).first() is not None
        
        # Get creator info
        creator = db.query(models.User).filter(models.User.id == event.creator_id).first()
        creator_info = None
        if creator:
            creator_info = {
                "id": creator.id,
                "username": creator.username,
                "profile_picture": creator.profile_picture
            }
        
        # Create result dictionary with event and additional fields
        # Fixed field mapping to match your actual model
        event_dict = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "location": event.location,  # Fixed: use 'location' not 'place'
            "cover_photo_url": event.cover_photo_url,  # Fixed: use 'cover_photo_url' not 'image_url'
            "guest_limit": event.guest_limit,
            "rsvp_close_time": event.rsvp_close_time,
            "visibility": event.visibility,
            "interested_count": event.interested_count,
            "going_count": event.going_count,
            "status": event.status,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "last_edited_at": event.last_edited_at,
            "creator_id": event.creator_id,  # Fixed: use 'creator_id' not 'created_by'
            "liked_by_current_user": user_liked,
            "liked_by_friends": friends_who_liked,
            "creator": creator_info
        }
        
        result.append(event_dict)
    
    return result

# Completely new get_liked_events function in FASTAPI/app/routers/event.py

@router.get("/liked", response_model=List[schemas.EventWithLikedUsers])
def get_liked_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get events liked by the current user with creator and friend information"""
    
    # Step 1: Get all events liked by the current user
    liked_event_ids = db.query(models.EventLike.event_id).filter(
        models.EventLike.user_id == current_user.id
    ).subquery()
    
    # Step 2: Get the events with their creators
    events_with_creators = db.query(
        models.Event,
        models.User.id.label('creator_id'),
        models.User.username.label('creator_username'),
        models.User.profile_picture.label('creator_profile_picture')
    ).join(
        models.User,
        models.Event.created_by == models.User.id
    ).filter(
        models.Event.id.in_(liked_event_ids)
    ).order_by(
        models.Event.start_date
    ).offset(skip).limit(limit).all()
    
    # Step 3: Get current user's friends
    accepted_friendships = db.query(models.Friendship).filter(
        and_(
            or_(
                models.Friendship.requester_id == current_user.id,
                models.Friendship.addressee_id == current_user.id
            ),
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Extract friend IDs
    friend_ids = set()
    for friendship in accepted_friendships:
        if friendship.requester_id == current_user.id:
            friend_ids.add(friendship.addressee_id)
        else:
            friend_ids.add(friendship.requester_id)
    
    # Step 4: For each event, get friends who also liked it
    results = []
    for event, creator_id, creator_username, creator_profile_picture in events_with_creators:
        # Get friends who liked this event
        friends_who_liked = []
        if friend_ids:
            friends_who_liked = db.query(models.User).join(
                models.EventLike,
                models.EventLike.user_id == models.User.id
            ).filter(
                and_(
                    models.EventLike.event_id == event.id,
                    models.User.id.in_(friend_ids)
                )
            ).all()
        
        # Create the response object
        event_response = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "place": event.place,
            "image_url": event.image_url,
            "created_at": event.created_at,
            "created_by": event.created_by,
            "liked_by_current_user": True,  # Always true since we're fetching liked events
            "liked_by_friends": friends_who_liked,
            "creator": {
                "id": creator_id,
                "username": creator_username,
                "profile_picture": creator_profile_picture
            }
        }
        
        results.append(event_response)
    
    return results

@router.get("/{id}/detail", response_model=schemas.EventWithLikedUsers)
def get_event_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Get the event
    event = db.query(models.Event).filter(models.Event.id == id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {id} not found"
        )
    
    # Get IDs of the user's friends
    friend_ids = []
    
    # Get friendships where user is requester
    requester_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    friend_ids.extend([f.addressee_id for f in requester_friendships])
    
    # Get friendships where user is addressee
    addressee_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.addressee_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    friend_ids.extend([f.requester_id for f in addressee_friendships])
    
    # Get users who have liked this event and are friends with current user
    friends_who_liked = db.query(models.User).join(
        models.EventLike,
        models.EventLike.user_id == models.User.id
    ).filter(
        and_(
            models.EventLike.event_id == id,
            models.User.id.in_(friend_ids)
        )
    ).all()
    
    # Check if current user has liked this event
    user_liked = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == id
        )
    ).first() is not None
    
    # Convert SQLAlchemy model to dict with correct field mapping
    event_dict = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,  # Use 'location' not 'place'
        "cover_photo_url": event.cover_photo_url,  # Use 'cover_photo_url' not 'image_url'
        "guest_limit": event.guest_limit,
        "rsvp_close_time": event.rsvp_close_time,
        "visibility": event.visibility,
        "created_at": event.created_at,
        "creator_id": event.creator_id,  # Use 'creator_id' not 'created_by'
        "liked_by_current_user": user_liked,
        "liked_by_friends": friends_who_liked
    }
    
    return event_dict

@router.get("/{id}", response_model=schemas.EventResponse)
def get_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {id} not found"
        )
    
    return event

@router.post("/{id}/like", status_code=status.HTTP_201_CREATED)
def like_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {id} not found"
        )
    
    # Check if user already liked this event
    existing_like = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == id
        )
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already liked this event"
        )
    
    # Create the like
    new_like = models.EventLike(
        user_id=current_user.id,
        event_id=id
    )
    
    db.add(new_like)
    db.commit()
    
    # Get user's friends who have also liked this event
    friends_who_liked = get_friends_who_liked_event(db, current_user.id, id)
    
    # Create matches and notifications for each friend who also liked this event
    for friend in friends_who_liked:
        # Check if a match already exists for this event between these users
        existing_match = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            and_(
                models.Match.event_id == id,
                models.MatchParticipant.user_id.in_([current_user.id, friend.id])
            )
        ).group_by(models.Match.id).having(
            func.count(models.MatchParticipant.user_id) == 2
        ).first()
        
        if not existing_match:
            # Create new match
            new_match = models.Match(
                event_id=id,
                context='FRIENDS'  # Set appropriate context based on event visibility
            )
            db.add(new_match)
            db.commit()
            db.refresh(new_match)
            
            # Add both users as participants
            participant1 = models.MatchParticipant(
                match_id=new_match.id,
                user_id=current_user.id
            )
            participant2 = models.MatchParticipant(
                match_id=new_match.id,
                user_id=friend.id
            )
            
            db.add(participant1)
            db.add(participant2)
            db.commit()
    
    # Generate notifications for friend matches
    NotificationService.notify_event_match(db=db, user_id=current_user.id, event_id=id)
    
    return {"message": "Event liked successfully"}

def get_friends_who_liked_event(db: Session, user_id: int, event_id: int):
    """
    Helper function to get friends of the user who have liked a specific event.
    """
    # Get all accepted friendships for the user
    friendships = db.query(models.Friendship).filter(
        and_(
            or_(
                models.Friendship.requester_id == user_id,
                models.Friendship.addressee_id == user_id
            ),
            models.Friendship.status == "accepted"
        )
    ).all()
    # Extract friend IDs
    friend_ids = set()
    for friendship in friendships:
        if friendship.requester_id == user_id:
            friend_ids.add(friendship.addressee_id)
        else:
            friend_ids.add(friendship.requester_id)
    # Get friends who liked the event
    friends_who_liked = db.query(models.User).join(
        models.EventLike,
        models.EventLike.user_id == models.User.id
    ).filter(
        and_(
            models.EventLike.event_id == event_id,
            models.User.id.in_(friend_ids)
        )
    ).all()
    return friends_who_liked

def create_event_response_dict(event, user_liked, friends_who_liked):
    """Helper function to create consistent event response dictionaries"""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,  # Use 'location' not 'place'
        "cover_photo_url": event.cover_photo_url,  # Use 'cover_photo_url' not 'image_url'
        "guest_limit": event.guest_limit,
        "rsvp_close_time": event.rsvp_close_time,
        "visibility": event.visibility,
        "created_at": event.created_at,
        "creator_id": event.creator_id,  # Use 'creator_id' not 'created_by'
        "liked_by_current_user": user_liked,
        "liked_by_friends": friends_who_liked
    }

@router.delete("/{id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Get the like if it exists
    like_query = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == id
        )
    )
    
    like = like_query.first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not liked this event"
        )
    
    # Delete the like
    like_query.delete(synchronize_session=False)
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
