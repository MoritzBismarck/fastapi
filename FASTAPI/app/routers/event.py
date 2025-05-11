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

    # Create a new event with the provided data
    new_event = models.Event(**event.model_dump(), created_by=current_user.id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
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


@router.get("", response_model=List[schemas.EventWithLikedUsers])  # Change response_model from EventResponse to EventWithLikedUsers
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
    
    if exclude_liked:
        # Get IDs of events already liked by current user
        liked_event_ids = db.query(models.EventLike.event_id).filter(
            models.EventLike.user_id == current_user.id
        ).scalar_subquery()
        query = query.filter(models.Event.id.notin_(liked_event_ids))
    
    # Filter by date range if provided
    if from_date:
        query = query.filter(models.Event.start_date >= from_date)
    if to_date:
        query = query.filter(
            or_(
                models.Event.end_date <= to_date,
                and_(
                    models.Event.end_date.is_(None),
                    models.Event.start_date <= to_date
                )
            )
        )
    
    # Get events with pagination, sorted by start_date
    events = query.order_by(models.Event.start_date).offset(skip).limit(limit).all()
    
    # NEW CODE: Get friend IDs for the current user
    friend_ids = []
    
    # Get friendships where user is requester
    requester_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Add addressee IDs to friend_ids
    friend_ids.extend([f.addressee_id for f in requester_friendships])
    
    # Get friendships where user is addressee
    addressee_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.addressee_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Add requester IDs to friend_ids
    friend_ids.extend([f.requester_id for f in addressee_friendships])
    
    # NEW CODE: For each event, get friends who liked it
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
        
        # Create result dictionary with event and additional fields
        event_dict = {
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
            "liked_by_current_user": user_liked,
            "liked_by_friends": friends_who_liked
        }
        
        result.append(event_dict)
    
    return result

@router.get("/liked", response_model=List[schemas.EventWithLikedUsers])  # Change response model
def get_liked_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get events liked by the current user"""
    
    # Get IDs of events liked by current user
    liked_events_query = db.query(models.Event).join(
        models.EventLike,
        models.EventLike.event_id == models.Event.id
    ).filter(
        models.EventLike.user_id == current_user.id
    ).order_by(
        models.Event.start_date
    ).offset(skip).limit(limit)
    
    liked_events = liked_events_query.all()
    
    # Get friend IDs for the current user
    friend_ids = set()  # Using a set to avoid duplicates
    
    # Get friendships where user is requester
    requester_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Add addressee IDs to friend_ids
    for f in requester_friendships:
        friend_ids.add(f.addressee_id)
    
    # Get friendships where user is addressee
    addressee_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.addressee_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Add requester IDs to friend_ids
    for f in addressee_friendships:
        friend_ids.add(f.requester_id)
    
    # Prepare the results
    results = []
    
    for event in liked_events:
        # Initialize liked_by_friends as an empty list
        friends_who_liked = []
        
        # Only query for friends who liked if user has friends
        if friend_ids:
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
        
        # Create a dictionary with all event attributes
        event_dict = {}
        for column in event.__table__.columns:
            event_dict[column.name] = getattr(event, column.name)
        
        # Add the additional fields
        event_dict["liked_by_current_user"] = True  # User has definitely liked these events
        event_dict["liked_by_friends"] = friends_who_liked
        
        results.append(event_dict)
    
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
    
    # Add addressee IDs to friend_ids
    friend_ids.extend([f.addressee_id for f in requester_friendships])
    
    # Get friendships where user is addressee
    addressee_friendships = db.query(models.Friendship).filter(
        and_(
            models.Friendship.addressee_id == current_user.id,
            models.Friendship.status == "accepted"
        )
    ).all()
    
    # Add requester IDs to friend_ids
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
    
    # First convert SQLAlchemy model to dict
    event_dict = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "all_day": getattr(event, "all_day", None),  # Use getattr for fields that might not exist
        "place": event.place,
        "image_url": event.image_url,
        "created_at": event.created_at,
        "created_by": event.created_by,
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
    
    # Generate notifications for friend matches
    NotificationService.notify_event_match(db=db, user_id=current_user.id, event_id=id)
    
    return {"message": "Event liked successfully"}



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
