# FASTAPI/app/services/notification_service.py

from sqlalchemy.orm import Session
from sqlalchemy import and_
from .. import models
from typing import List, Optional

class NotificationService:
    """Service for handling notifications including friend-event matches"""
    
    @staticmethod
    def create_notification(db: Session, user_id: int, content: str) -> models.Notification:
        """Create a new notification for a user"""
        notification = models.Notification(
            user_id=user_id,
            content=content,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Optional[models.Notification]:
        """Mark a notification as read for a specific user"""
        notification = db.query(models.Notification).filter(
            and_(
                models.Notification.id == notification_id,
                models.Notification.user_id == user_id
            )
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @staticmethod
    def get_user_notifications(db: Session, user_id: int, limit: int = 20, skip: int = 0, unread_only: bool = False):
        """Get notifications for a user with pagination"""
        query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(models.Notification.is_read == False)
            
        return query.order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def notify_event_match(db: Session, user_id: int, event_id: int):
        """
        Check if any friends of the user have also liked this event,
        and create notifications for both the user and the friends
        """
        # Get all friendships where this user is part of (either requester or addressee)
        friends_ids = []
        
        # Get friendships where user is requester
        requester_friendships = db.query(models.Friendship).filter(
            and_(
                models.Friendship.requester_id == user_id,
                models.Friendship.status == "accepted"
            )
        ).all()
        
        # Add addressee IDs to friends list
        for friendship in requester_friendships:
            friends_ids.append(friendship.addressee_id)
        
        # Get friendships where user is addressee
        addressee_friendships = db.query(models.Friendship).filter(
            and_(
                models.Friendship.addressee_id == user_id,
                models.Friendship.status == "accepted"
            )
        ).all()
        
        # Add requester IDs to friends list
        for friendship in addressee_friendships:
            friends_ids.append(friendship.requester_id)
        
        # Get the event details
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not event:
            return []
        
        # Get all friends who also liked this event
        friend_likes = db.query(models.EventLike).filter(
            and_(
                models.EventLike.event_id == event_id,
                models.EventLike.user_id.in_(friends_ids)
            )
        ).all()
        
        # Create notifications for matches
        notifications = []
        
        # Get username of current user
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        
        # Notify friends that current user also liked this event
        for like in friend_likes:
            friend = db.query(models.User).filter(models.User.id == like.user_id).first()
            
            # Notify current user about the friend match
            user_notification = NotificationService.create_notification(
                db=db,
                user_id=user_id,
                content=f"You and {friend.username} both liked the event '{event.title}'!"
            )
            notifications.append(user_notification)
            
            # Notify the friend about the match
            friend_notification = NotificationService.create_notification(
                db=db,
                user_id=friend.id,
                content=f"You and {current_user.username} both liked the event '{event.title}'!"
            )
            notifications.append(friend_notification)
        
        return notifications