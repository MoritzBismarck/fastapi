# Create a new file: FASTAPI/app/routers/event.py

from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, oauth2
from ..database import get_db
from ..services.notification_service import NotificationService
from sqlalchemy import and_, func
import uuid
from ..services import storage_service

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    new_event = models.Event(**event.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

# app/main.py

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


@router.get("/", response_model=List[schemas.Event])
def get_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 10,
    skip: int = 0,
    exclude_liked: bool = True
):
    # Base query for events
    query = db.query(models.Event)
    
    if exclude_liked:
        # Get IDs of events already liked by current user
        liked_event_ids = db.query(models.EventLike.event_id).filter(
            models.EventLike.user_id == current_user.id
        ).scalar_subquery()

        query = query.filter(models.Event.id.notin_(liked_event_ids))
    
    # Get events with pagination
    events = query.order_by(models.Event.event_date).offset(skip).limit(limit).all()
    
    return events

@router.get("/liked", response_model=List[schemas.Event])
def get_liked_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get events liked by the current user"""
    
    # Get IDs of events liked by current user
    liked_events = db.query(models.Event).join(
        models.EventLike,
        models.EventLike.event_id == models.Event.id
    ).filter(
        models.EventLike.user_id == current_user.id
    ).order_by(
        models.Event.event_date
    ).offset(skip).limit(limit).all()
    
    return liked_events

@router.get("/{id}", response_model=schemas.Event)
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
