# FASTAPI/app/routers/invitation.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, oauth2
from ..database import get_db
from ..services.invitation_service import InvitationService

router = APIRouter(
    prefix="/invitations",
    tags=["invitations"]
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.InvitationTokenOut)
def create_invitation_token(
    token_data: schemas.InvitationTokenCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Only users with admin role can create invitation tokens
    # You may want to implement this role-based check
    
    # Create invitation token
    invitation = InvitationService.create_invitation_token(
        db=db,
        description=token_data.description,
        created_by=current_user.id,
        expires_days=token_data.expires_days if token_data.expires_days else 30
    )
    
    return invitation

# Add this to FASTAPI/app/routers/invitation.py

from fastapi import Response
from ..services.qrcode_service import QRCodeService

@router.get("/{token_id}/qrcode", response_class=Response)
def get_invitation_qrcode(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    size: int = 10
):
    # Get the token
    invitation = db.query(models.InvitationToken).filter(models.InvitationToken.id == token_id).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation token not found")
    
    # Create URL for registration with this token
    registration_url = f"http://yourdomain.com/signup/{invitation.token}"
    
    # Generate QR code
    qr_code = QRCodeService.generate_qr_code(registration_url, size)
    
    return Response(content=qr_code, media_type="image/png")