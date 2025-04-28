# Create a new file: FASTAPI/app/routers/notification.py

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, oauth2
from ..database import get_db
from ..services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

@router.get("/", response_model=List[schemas.Notification])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = 20,
    skip: int = 0,
    unread_only: bool = False
):
    notifications = NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        limit=limit,
        skip=skip,
        unread_only=unread_only
    )
    
    return notifications

@router.api_route("/{id}/read", methods=["PATCH", "POST"], response_model=schemas.Notification)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    notification = NotificationService.mark_as_read(
        db=db,
        notification_id=id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with id {id} not found or does not belong to current user"
        )
    
    return notification