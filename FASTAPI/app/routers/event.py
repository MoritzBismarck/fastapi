# Create a new file: FASTAPI/app/routers/event.py

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from .. import models, schemas, oauth2
from ..database import get_db
from ..services.notification_service import NotificationService
from sqlalchemy import and_, func, or_
import uuid
from ..services import storage_service
import jwt
from ..config import settings


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

# Replace the existing /matches endpoint in FASTAPI/app/routers/event.py

# Fix for FASTAPI/app/routers/event.py - get_user_matches function
# Replace the existing get_user_matches function with this fixed version

# Fix for FASTAPI/app/routers/event.py - get_user_matches function
# Replace the existing get_user_matches function with this fixed version

@router.get("/matches")
def get_user_matches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get all events that the user has matches for, sorted by event date"""
    
    try:
        # Step 1: Get all matches for the current user
        user_matches = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            models.MatchParticipant.user_id == current_user.id
        ).subquery()
        
        # Step 2: Get the events from those matches with their creators
        events_with_creators = db.query(
            models.Event,
            models.User.id.label('creator_id'),
            models.User.username.label('creator_username'),
            models.User.profile_picture.label('creator_profile_picture')
        ).join(
            user_matches,
            models.Event.id == user_matches.c.event_id
        ).join(
            models.User,
            models.Event.creator_id == models.User.id
        ).order_by(
            models.Event.start_date.asc()  # Sort by event date ascending
        ).offset(skip).limit(limit).all()
        
        # Step 3: Get current user's friends
        accepted_friendships = db.query(models.Friendship).filter(
            and_(
                or_(
                    models.Friendship.requester_id == current_user.id,
                    models.Friendship.addressee_id == current_user.id
                ),
                models.Friendship.status == 'accepted'
            )
        ).all()
        
        friend_ids = set()
        for friendship in accepted_friendships:
            if friendship.requester_id == current_user.id:
                friend_ids.add(friendship.addressee_id)
            else:
                friend_ids.add(friendship.requester_id)
        
        # Step 4: Build result with liked friends and RSVP data
        result = []
        for event, creator_id, creator_username, creator_profile_picture in events_with_creators:
            
            # Get ALL users who RSVP'd as "GOING" to this event (to exclude from liked list)
            users_going = db.query(models.User.id).join(
                models.RSVP,
                models.RSVP.user_id == models.User.id
            ).filter(
                and_(
                    models.RSVP.event_id == event.id,
                    models.RSVP.status == 'GOING'
                )
            ).subquery()
            
            # Get user IDs who are going (for exclusion from liked list)
            going_user_ids = {row[0] for row in db.query(users_going.c.id).all()}
            
            # Get users who liked this event (friends + current user) BUT exclude those who RSVP'd as GOING
            all_liked_users = []
            
            # First, get friends who liked this event but haven't RSVP'd as going
            if friend_ids:
                liked_friends = db.query(models.User).join(
                    models.EventLike,
                    models.EventLike.user_id == models.User.id
                ).filter(
                    and_(
                        models.EventLike.event_id == event.id,
                        models.User.id.in_(friend_ids),
                        ~models.User.id.in_(going_user_ids)  # EXCLUDE users who RSVP'd as going
                    )
                ).all()
                
                all_liked_users.extend([
                    {
                        "id": friend.id,
                        "username": friend.username,
                        "email": friend.email,
                        "profile_picture": friend.profile_picture
                    }
                    for friend in liked_friends
                ])
            
            # Check if current user liked this event (they should have, since it's a match)
            user_liked = db.query(models.EventLike).filter(
                and_(
                    models.EventLike.user_id == current_user.id,
                    models.EventLike.event_id == event.id
                )
            ).first() is not None
            
            # FIXED: Add current user to the liked list ONLY if they liked it AND haven't RSVP'd as going
            if user_liked and current_user.id not in going_user_ids:
                # Check if current user is not already in the list (in case they're somehow in friend_ids)
                current_user_in_list = any(user["id"] == current_user.id for user in all_liked_users)
                if not current_user_in_list:
                    all_liked_users.append({
                        "id": current_user.id,
                        "username": current_user.username,
                        "email": current_user.email,
                        "profile_picture": current_user.profile_picture
                    })
            
            # Get current user's RSVP status for this event
            current_user_rsvp = db.query(models.RSVP).filter(
                and_(
                    models.RSVP.user_id == current_user.id,
                    models.RSVP.event_id == event.id
                )
            ).first()
            
            current_rsvp_data = None
            if current_user_rsvp:
                current_rsvp_data = {
                    "status": current_user_rsvp.status,
                    "responded_at": current_user_rsvp.responded_at.isoformat() if current_user_rsvp.responded_at else None
                }
            
            # Creator info
            creator_info = None
            if creator_id:
                creator_info = {
                    "id": creator_id,
                    "username": creator_username,
                    "profile_picture": creator_profile_picture
                }
            
            # Convert SQLAlchemy model to dict with correct field mapping and handle datetime serialization
            event_dict = {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "start_date": event.start_date.isoformat() if event.start_date else None,
                "end_date": event.end_date.isoformat() if event.end_date else None,
                "start_time": str(event.start_time) if event.start_time else None,
                "end_time": str(event.end_time) if event.end_time else None,
                "location": event.location,
                "cover_photo_url": event.cover_photo_url,
                "guest_limit": event.guest_limit,
                "rsvp_close_time": event.rsvp_close_time.isoformat() if event.rsvp_close_time else None,
                "visibility": event.visibility,
                "interested_count": event.interested_count,
                "going_count": event.going_count,
                "status": event.status,
                "created_at": event.created_at.isoformat() if event.created_at else None,
                "updated_at": event.updated_at.isoformat() if event.updated_at else None,
                "last_edited_at": event.last_edited_at.isoformat() if event.last_edited_at else None,
                "creator_id": event.creator_id,
                "liked_by_current_user": user_liked,
                "liked_by_friends": all_liked_users,  # FIXED: Now includes current user
                "creator": creator_info,
                "current_user_rsvp": current_rsvp_data
            }
            
            result.append(event_dict)
        
        return result
        
    except Exception as e:
        # For debugging - log the actual error
        print(f"Error in get_user_matches: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # For now, return an empty list instead of failing
        return []

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
    
    # UPDATED: Check if user has an active RSVP for this event
    # Now only GOING blocks unliking (since INTERESTED is removed)
    active_rsvp = db.query(models.RSVP).filter(
        and_(
            models.RSVP.user_id == current_user.id,
            models.RSVP.event_id == id,
            models.RSVP.status == 'GOING'  # Only GOING blocks unliking now
        )
    ).first()
    
    if active_rsvp:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot unlike event while you have an active RSVP. Please cancel your RSVP first (current status: {active_rsvp.status})"
        )
    
    # Delete the like
    like_query.delete(synchronize_session=False)
    db.commit()
    
    # Clean up any matches when user unlikes an event
    from ..services.match_service import MatchService
    
    # Delete matches for this event/user combination
    MatchService.delete_matches_for_event_unlike(db, current_user.id, id)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{event_id}/rsvp", response_model=schemas.RSVPResponse, status_code=status.HTTP_201_CREATED)
def rsvp_to_event(
    event_id: int,
    rsvp_data: schemas.RSVPCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """RSVP to an event (GOING or CANCELLED only)"""
    
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # UPDATED: Validate that user has liked the event first
    user_like = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == event_id
        )
    ).first()
    
    if not user_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must like an event before you can RSVP to it"
        )
    
    # Check if user already has an RSVP for this event
    existing_rsvp = db.query(models.RSVP).filter(
        and_(
            models.RSVP.user_id == current_user.id,
            models.RSVP.event_id == event_id
        )
    ).first()
    
    if existing_rsvp:
        # Update existing RSVP
        existing_rsvp.status = rsvp_data.status
        existing_rsvp.responded_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_rsvp)
        
        # Update event counts
        update_event_rsvp_counts(db, event_id)
        
        return existing_rsvp
    else:
        # Create new RSVP
        new_rsvp = models.RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status=rsvp_data.status
        )
        
        db.add(new_rsvp)
        db.commit()
        db.refresh(new_rsvp)
        
        # Update event counts
        update_event_rsvp_counts(db, event_id)
        
        return new_rsvp

@router.delete("/{event_id}/rsvp", status_code=status.HTTP_204_NO_CONTENT)
def cancel_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Cancel/remove RSVP for an event"""
    
    # Find existing RSVP
    rsvp = db.query(models.RSVP).filter(
        and_(
            models.RSVP.user_id == current_user.id,
            models.RSVP.event_id == event_id
        )
    ).first()
    
    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )
    
    # Delete the RSVP
    db.delete(rsvp)
    db.commit()
    
    # Update event counts
    update_event_rsvp_counts(db, event_id)
    
    return

@router.get("/{event_id}/rsvps", response_model=List[schemas.UserWithRSVP])
def get_event_rsvps(
    event_id: int,
    status_filter: Optional[str] = Query(None, regex="^(INTERESTED|GOING|CANCELLED)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get all RSVPs for an event, optionally filtered by status"""
    
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # Base query
    query = db.query(models.User, models.RSVP.status.label('rsvp_status')).join(
        models.RSVP,
        models.RSVP.user_id == models.User.id
    ).filter(
        models.RSVP.event_id == event_id
    )
    
    # Apply status filter if provided
    if status_filter:
        query = query.filter(models.RSVP.status == status_filter)
    
    # Execute query
    results = query.all()
    
    # Format results
    users_with_rsvp = []
    for user, rsvp_status in results:
        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "rsvp_status": rsvp_status
        }
        users_with_rsvp.append(user_dict)
    
    return users_with_rsvp

def update_event_rsvp_counts(db: Session, event_id: int):
    """Helper function to update event RSVP counts"""
    
    # Count interested users
    interested_count = db.query(models.RSVP).filter(
        and_(
            models.RSVP.event_id == event_id,
            models.RSVP.status == 'INTERESTED'
        )
    ).count()
    
    # Count going users
    going_count = db.query(models.RSVP).filter(
        and_(
            models.RSVP.event_id == event_id,
            models.RSVP.status == 'GOING'
        )
    ).count()
    
    # Update event counts
    db.query(models.Event).filter(models.Event.id == event_id).update({
        'interested_count': interested_count,
        'going_count': going_count
    })
    
    db.commit()


@router.get("/{event_id}/chat-info")
def get_event_chat_info(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get event info and participants for chat"""
    
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # Check if user has access (must have liked the event)
    user_like = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == event_id
        )
    ).first()
    
    if not user_like:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must like this event to access the chat"
        )
    
    # Get all users who liked this event (chat participants)
    participants = db.query(models.User).join(
        models.EventLike,
        models.EventLike.user_id == models.User.id
    ).filter(
        models.EventLike.event_id == event_id
    ).all()
    
    # Get event creator
    creator = db.query(models.User).filter(models.User.id == event.creator_id).first()
    
    # Build response
    response = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,
        "cover_photo_url": event.cover_photo_url,
        "creator": {
            "id": creator.id,
            "username": creator.username,
            "profile_picture": creator.profile_picture
        } if creator else None,
        "match_participants": [
            {
                "id": user.id,
                "username": user.username,
                "profile_picture": user.profile_picture,
                "email": user.email
            }
            for user in participants
        ]
    }
    
    return response

@router.get("/{event_id}/messages", response_model=List[schemas.EventMessage])
def get_event_messages(
    event_id: int,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get chat messages for an event - SIMPLIFIED VERSION"""
    
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # Check if user has access (must have liked the event)
    user_like = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == event_id
        )
    ).first()
    
    if not user_like:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must like this event to access the chat"
        )
    
    # Get messages directly for this event - MUCH SIMPLER!
    messages = db.query(models.EventMessage).join(
        models.User,
        models.EventMessage.sender_id == models.User.id
    ).filter(
        models.EventMessage.event_id == event_id
    ).order_by(
        models.EventMessage.sent_at.desc()
    ).limit(limit).all()
    
    # Reverse to get chronological order
    messages.reverse()
    
    # Format response
    formatted_messages = []
    for message in messages:
        formatted_messages.append({
            "id": message.id,
            "content": message.content,
            "sent_at": message.sent_at,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
                "profile_picture": message.sender.profile_picture
            }
        })
    
    return formatted_messages

@router.post("/{event_id}/messages", status_code=status.HTTP_201_CREATED)
def send_event_message(
    event_id: int,
    message_data: schemas.EventMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Send a message to event chat - SIMPLIFIED VERSION"""
    
    # Check if event exists
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )
    
    # Check if user has access (must have liked the event)
    user_like = db.query(models.EventLike).filter(
        and_(
            models.EventLike.user_id == current_user.id,
            models.EventLike.event_id == event_id
        )
    ).first()
    
    if not user_like:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must like this event to send messages"
        )
    
    # Create the message directly tied to event - NO MATCH COMPLEXITY!
    new_message = models.EventMessage(
        event_id=event_id,
        sender_id=current_user.id,
        content=message_data.content
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Return the created message
    return {
        "id": new_message.id,
        "content": new_message.content,
        "sent_at": new_message.sent_at.isoformat(),
        "sender": {
            "id": current_user.id,
            "username": current_user.username,
            "profile_picture": current_user.profile_picture
        },
        "message": "Message sent successfully"
    }