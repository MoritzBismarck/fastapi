# FASTAPI/app/services/match_service.py - Fixed version

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
                db.flush()  # Get the ID
                
                # Add participants
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
                matches_created.append(new_match.id)
        
        db.commit()
        return matches_created
    
    @staticmethod
    def get_match_participants(db: Session, match_id: int) -> List[models.User]:
        """Get all participants in a match"""
        participants = db.query(models.User).join(
            models.MatchParticipant
        ).filter(
            models.MatchParticipant.match_id == match_id
        ).all()
        
        return participants
    
    @staticmethod
    def delete_matches_for_event_unlike(db: Session, user_id: int, event_id: int):
        """
        FIXED: Smart match management when a user unlikes an event:
        - Remove only the user who unliked from matches
        - Keep matches alive if other participants remain
        - Only delete match completely if it becomes empty or has only 1 person left
        - REMOVED ChatMessage logic since we now use EventMessage for direct event messaging
        """
        
        # Find all matches for this event that include this user
        matches_with_user = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            and_(
                models.Match.event_id == event_id,
                models.MatchParticipant.user_id == user_id
            )
        ).all()
        
        matches_deleted = []
        participants_removed = []
        
        for match in matches_with_user:
            # Get current participant count
            current_participants = db.query(models.MatchParticipant).filter(
                models.MatchParticipant.match_id == match.id
            ).all()
            
            participant_count = len(current_participants)
            
            if participant_count <= 2:
                # If 2 or fewer participants, delete the entire match
                # (since a match needs at least 2 people to be meaningful)
                
                # Delete all participants first
                db.query(models.MatchParticipant).filter(
                    models.MatchParticipant.match_id == match.id
                ).delete()
                
                # REMOVED: Chat message deletion since we use direct event messaging now
                # The event messages are tied to events, not matches, so they don't need cleanup
                
                # Delete the match itself
                db.query(models.Match).filter(
                    models.Match.id == match.id
                ).delete()
                
                matches_deleted.append(match.id)
                
            else:
                # If more than 2 participants, remove only this user
                # Keep the match alive for remaining participants
                
                db.query(models.MatchParticipant).filter(
                    and_(
                        models.MatchParticipant.match_id == match.id,
                        models.MatchParticipant.user_id == user_id
                    )
                ).delete()
                
                participants_removed.append({
                    'match_id': match.id,
                    'user_id': user_id,
                    'remaining_participants': participant_count - 1
                })
                
                # REMOVED: System message logic since we're not using match-based chat anymore
                # Event messages are now direct to events, so no system messages needed for matches
        
        db.commit()
        
        # Return summary of what happened (useful for logging/debugging)
        return {
            'matches_deleted': matches_deleted,
            'participants_removed': participants_removed
        }
    
    @staticmethod
    def get_match_participants_count(db: Session, match_id: int) -> int:
        """Get the number of participants in a match"""
        return db.query(models.MatchParticipant).filter(
            models.MatchParticipant.match_id == match_id
        ).count()

    @staticmethod
    def add_user_to_existing_matches(db: Session, user_id: int, event_id: int):
        """
        When a user likes an event, add them to existing matches for that event
        if they're friends with existing participants
        """
        
        # Get user's friends
        user_friend_ids = set()
        
        # Get friendships where user is requester
        requester_friendships = db.query(models.Friendship).filter(
            and_(
                models.Friendship.requester_id == user_id,
                models.Friendship.status == "accepted"
            )
        ).all()
        user_friend_ids.update([f.addressee_id for f in requester_friendships])
        
        # Get friendships where user is addressee
        addressee_friendships = db.query(models.Friendship).filter(
            and_(
                models.Friendship.addressee_id == user_id,
                models.Friendship.status == "accepted"
            )
        ).all()
        user_friend_ids.update([f.requester_id for f in addressee_friendships])
        
        if not user_friend_ids:
            return []  # No friends, no matches to join
        
        # Find existing matches for this event that contain friends
        existing_matches = db.query(models.Match).join(
            models.MatchParticipant
        ).filter(
            and_(
                models.Match.event_id == event_id,
                models.MatchParticipant.user_id.in_(user_friend_ids)
            )
        ).distinct().all()
        
        matches_joined = []
        
        for match in existing_matches:
            # Check if user is already in this match
            user_already_in_match = db.query(models.MatchParticipant).filter(
                and_(
                    models.MatchParticipant.match_id == match.id,
                    models.MatchParticipant.user_id == user_id
                )
            ).first()
            
            if not user_already_in_match:
                # Add user to this existing match
                new_participant = models.MatchParticipant(
                    match_id=match.id,
                    user_id=user_id
                )
                db.add(new_participant)
                matches_joined.append(match.id)
                
                # REMOVED: System message logic since we're using direct event messaging now
                # No need to add system messages to matches since chat is event-based
        
        db.commit()
        return matches_joined