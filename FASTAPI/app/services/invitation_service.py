# FASTAPI/app/services/invitation_service.py
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session
from .. import models

class InvitationService:
    @staticmethod
    def generate_token(length: int = 16) -> str:
        """Generate a random token string of specified length."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def create_invitation_token(
        db: Session, 
        description: str, 
        created_by: int, 
        expires_days: int = 30
    ) -> models.InvitationToken:
        """Create a new invitation token in the database."""
        token = InvitationService.generate_token()
        expires_at = datetime.now() + timedelta(days=expires_days)
        
        invitation = models.InvitationToken(
            token=token,
            description=description,
            created_by=created_by,
            expires_at=expires_at,
            usage_count=0
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        return invitation
    
    @staticmethod
    def validate_token(db: Session, token: str) -> Optional[models.InvitationToken]:
        """Validate if a token exists and hasn't expired."""
        invitation = db.query(models.InvitationToken).filter(
            models.InvitationToken.token == token
        ).first()
        
        if not invitation:
            return None
        
        # Fix: Use datetime.now() with timezone info to match expires_at
        current_time = datetime.now(invitation.expires_at.tzinfo)
        if invitation.expires_at < current_time:
            return None
            
        return invitation