# FASTAPI/app/routers/invitation.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from ..services.qrcode_service import QRCodeService

from .. import models, schemas, oauth2
from ..database import get_db
from ..services.invitation_service import InvitationService

router = APIRouter(
    prefix="/invitations",
    tags=["invitations"]
)

@router.post("", status_code=status.HTTP_201_CREATED, response_model=schemas.InvitationTokenOut)
def create_invitation_token(
    token_data: schemas.InvitationTokenCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Convert to dictionary and get values
    data = token_data.model_dump()
    
    # Create invitation token
    invitation = InvitationService.create_invitation_token(
        db=db,
        description=data["description"],
        created_by=current_user.id,
        expires_days=data["expires_days"] if data["expires_days"] is not None else 30
    )
    
    return invitation

# Add this to FASTAPI/app/routers/invitation.py


@router.get("/{token_id}/qrcode", response_class=Response)
def get_invitation_qrcode(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    size: int = 10
):
    # Get the token with proper error handling
    invitation = db.query(models.InvitationToken).filter(models.InvitationToken.id == token_id).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Invitation token with ID {token_id} not found"
        )
    
    # Add logging to debug
    print(f"Found invitation token: {invitation.token} for ID: {token_id}")
    
    # Get your frontend URL from settings
    frontend_url = "https://bone-social.com"  # You can also use settings.FRONTEND_URL if configured
    
    # Create URL for registration with this token
    registration_url = f"{frontend_url}/signup/{invitation.token}"
    
    # Generate QR code
    qr_code = QRCodeService.generate_qr_code(registration_url, size)
    
    return Response(content=qr_code, media_type="image/png")


# Add to FASTAPI/app/routers/invitation.py
@router.get("", response_model=List[schemas.InvitationTokenOut])
def get_invitation_tokens(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get all invitation tokens created by the current user"""
    tokens = db.query(models.InvitationToken).filter(
        models.InvitationToken.created_by == current_user.id
    ).order_by(models.InvitationToken.created_at.desc()).all()
    
    return tokens