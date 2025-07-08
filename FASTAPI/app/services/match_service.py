# Create new file: FASTAPI/app/services/match_service.py

from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from .. import models
from typing import List, Optional

class MatchService:
    """Service for handling event matches between users"""
    
    @staticmethod
    def create_match_if_needed(db: Session, user_id: int, event_id: int, friend_user_ids: List[int]):
        """Create matches between user and friends who liked the same event"""
        
        matches_created = []
        
        for friend_id in friend_user_ids:
            # Check if a match already exists for this event between these users
            existing_match = db.query(models.Match).join(
                models.MatchParticipant
            ).filter(
                models.Match.event_id == event_id
            ).group_by(models.Match.id).having(
                func.array_agg(models.MatchParticipant.user_id).op('&&')(
                    func.array([user_id, friend_id])
                )
            ).first()
            
            if not existing_match:
                # Get event to determine context
                event = db.query(models.Event).filter(models.Event.id == event_id).first()
                if not event:
                    continue
                
                # Determine match context based on event visibility
                match_context = 'PUBLIC'
                if event.visibility == 'PRIVATE':
                    match_context = 'PRIVATE'
                elif event.visibility == 'FRIENDS':
                    match_context = 'FRIENDS'
                
                # Create new match
                new_match = models.Match(
                    event_id=event_id,
                    context=match_context
                )
                db.add(new_match)
                db.commit()
                db.refresh(new_match)
                
                # Add both users as participants
                participant1 = models.MatchParticipant(
                    match_id=new_match.id,
                    user_id=user_id
                )
                participant2 = models.MatchParticipant(
                    match_id=new_match.id,
                    user_id=friend_id
                )
                
                db.add(participant1)
                db.add(participant2)
                db.commit()
                
                matches_created.append(new_match)
        
        return matches_created
    
    @staticmethod
    def get_user_matches(db: Session, user_id: int, limit: int = 20, skip: int = 0):
        """Get all matches for a user with pagination"""
        
        matches = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            models.MatchParticipant.user_id == user_id
        ).order_by(
            models.Match.last_message_at.desc().nullslast(),
            models.Match.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return matches
    
    @staticmethod
    def get_match_participants(db: Session, match_id: int):
        """Get all participants in a match"""
        
        participants = db.query(models.User).join(
            models.MatchParticipant
        ).filter(
            models.MatchParticipant.match_id == match_id
        ).all()
        
        return participants
    
    @staticmethod
    def delete_matches_for_event_unlike(db: Session, user_id: int, event_id: int):
        """Delete matches when a user unlikes an event"""
        
        # Find matches for this event that include this user
        matches_to_delete = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            and_(
                models.Match.event_id == event_id,
                models.MatchParticipant.user_id == user_id
            )
        ).all()
        
        for match in matches_to_delete:
            # Check if this match only has 2 participants (the standard case)
            participant_count = db.query(models.MatchParticipant).filter(
                models.MatchParticipant.match_id == match.id
            ).count()
            
            if participant_count <= 2:
                # Delete the entire match since one user is unliking
                db.query(models.MatchParticipant).filter(
                    models.MatchParticipant.match_id == match.id
                ).delete()
                db.query(models.Match).filter(
                    models.Match.id == match.id
                ).delete()
        
        db.commit()