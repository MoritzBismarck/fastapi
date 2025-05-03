import uuid
from sqlalchemy import or_, and_
from .. import models, schemas, utils, oauth2
from fastapi import Body, FastAPI, Response, status, HTTPException, Depends, APIRouter, UploadFile, File
from ..database import engine, get_db
from sqlalchemy.orm import Session
from ..services import storage_service  # Import the storage_service module
from ..services.invitation_service import InvitationService

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_data(db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    return current_user


@router.get("/count", response_model=dict)
def get_user_count(db: Session = Depends(get_db)):
    """Return the total count of users in the system"""
    count = db.query(models.User).count()
    return {"count": count}

@router.put("/me", response_model=schemas.UserOut)
def update_user_profile(
    user_update: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Update the current user's profile information"""
    
    user_query = db.query(models.User).filter(models.User.id == current_user.id)
    
    # If updating username, check if it's already taken
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(models.User).filter(models.User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Update the user with the provided values, ignoring None values
    update_data = user_update.model_dump(exclude_unset=True)
    user_query.update(update_data, synchronize_session=False)
    
    db.commit()
    
    # Return the updated user
    return user_query.first()

@router.post("/me/picture", response_model=schemas.UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Upload a profile picture for the current user"""
    # Generate a unique filename
    original_filename = file.filename
    file_extension = original_filename.split(".")[-1] if "." in original_filename else "jpg"
    object_name = f"profile-pictures/{current_user.id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        # Reset the file pointer to the beginning
        file.file.seek(0)
        # Upload the file to storage service
        storage_service.upload_fileobj(file.file, object_name)
        
        # Get the public URL
        file_url = storage_service.generate_file_url(object_name)
        
        # Update the user's profile picture URL
        user_query = db.query(models.User).filter(models.User.id == current_user.id)
        user_query.update({"profile_picture": file_url}, synchronize_session=False)
        db.commit()
        
        # Return the updated user
        return user_query.first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )

@router.get("", response_model=list[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: int = Depends(oauth2.get_current_user)):
    users = db.query(models.User).all()
    # Optionally, filter out the current user if needed:
    users = [user for user in users if user.id != current_user.id]
    return users

@router.get("/overview", response_model=schemas.FriendsOverview)
def get_users_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Fetch all users except the current user
    users = db.query(models.User).filter(models.User.id != current_user.id).all()
    
    # Fetch all friendship records involving the current user
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.addressee_id == current_user.id
        )
    ).all()

    processed_users = []
    for user in users:
        # Check for ANY friendship involving this user and current user
        friendship = next(
            (
                f for f in friendships 
                if (f.requester_id == current_user.id and f.addressee_id == user.id) or
                (f.requester_id == user.id and f.addressee_id == current_user.id)
            ),
            None
        )
        
        # Find sent friendship (current user to this user)
        sent_friendship = next(
            (
                f for f in friendships 
                if f.requester_id == current_user.id and 
                f.addressee_id == user.id
            ),
            None
        )
        
        # Find received friendship (this user to current user)
        received_friendship = next(
            (
                f for f in friendships 
                if f.requester_id == user.id and 
                f.addressee_id == current_user.id
            ),
            None
        )
        
        # Determine relationship state
        relationship_state = "none"
        if friendship and friendship.status == "accepted":
            relationship_state = "friends"
        elif sent_friendship and sent_friendship.status == "pending":
            relationship_state = "request_sent"
        elif received_friendship and received_friendship.status == "pending":
            relationship_state = "request_received"
        
        # Skip users that are already friends if you don't want them showing up in suggestions
        if relationship_state == "friends":
            continue

        processed_users.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "relationship": relationship_state,
            "friendshipId": friendship.id if friendship else None,
            "liked": bool(sent_friendship and sent_friendship.status == "pending"),
            "hasLikedCurrentUser": bool(received_friendship and received_friendship.status == "pending")
        })
    
    # Sort: first those who have sent friend requests, then alphabetically
    processed_users.sort(key=lambda u: (u["relationship"] != "request_received", u["username"]))
    
    # Get established friendships
    established_friendships = []
    for f in friendships:
        if f.status == "accepted":
            # Get the friend (the other user in this friendship)
            friend_id = f.addressee_id if f.requester_id == current_user.id else f.requester_id
            friend = db.query(models.User).filter(models.User.id == friend_id).first()
            
            # Convert User object to dictionary
            friend_dict = {
                "id": friend.id,
                "username": friend.username or f"User {friend.id}",
                "email": friend.email
            }
            
            established_friendships.append({
                "id": f.id,
                "friend": friend_dict,  # Use the dictionary instead of the User object
                "status": f.status
            })

    if current_user.invitation_token_id:
        # Prioritize users who registered with the same invitation token
        same_token_users = db.query(models.User).filter(
            and_(
                models.User.invitation_token_id == current_user.invitation_token_id,
                models.User.id != current_user.id
            )
        ).all()
        
        # Add a "recommended" flag to users who shared the same token
        token_user_ids = {user.id for user in same_token_users}
        
        # Tag users as recommended in the processed_users list
        for user_data in processed_users:
            user_data["recommended"] = user_data["id"] in token_user_ids
            
        # Move recommended users to the top of the list
        processed_users.sort(key=lambda u: (not u.get("recommended"), u["relationship"] != "request_received", u["username"]))
    
    return {
        "users": processed_users,
        "friends": established_friendships
    }

# Update in FASTAPI/app/routers/user.py

@router.post("/{token}", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut)
def create_user(
    token: str,
    user: schemas.UserCreate, 
    db: Session = Depends(get_db)
):
    # Check if this is the first user in the system
    user_count = db.query(models.User).count()
    is_first_user = user_count == 0
    
    # For the first user or when token is "first-user", we bypass validation
    if not is_first_user and token != "first-user":
        # Validate the invitation token
        invitation = InvitationService.validate_token(db, token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Invalid or expired invitation token"
            )
        # Store the invitation ID
        invitation_id = invitation.id
        
        # Link the user to the invitation token they used
        user_data = user.model_dump()
        user_data["invitation_token_id"] = invitation_id
    else:
        # If this is the first user but not using the special token
        if token != "first-user" and not is_first_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token for first user creation"
            )
        user_data = user.model_dump()
    
    # Hash the password
    hashed_password = utils.hash(user.password)
    user_data["password"] = hashed_password
    
    # Create the user
    new_user = models.User(**user_data)
    
    # For non-first users with a valid invitation, update usage count
    if not is_first_user and token != "first-user":
        invitation = db.query(models.InvitationToken).filter(models.InvitationToken.id == invitation_id).first()
        invitation.usage_count += 1
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get('/{id}', response_model=schemas.UserOut)
def get_user(id: int, db: Session = Depends(get_db),):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id {id} not found")
    return user

@router.get("/search", response_model=list[schemas.UserOut])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth2.get_current_user),
    limit: int = 10
):
    """Search for users by username or email."""
    if len(q) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 3 characters long"
        )
    
    # Search for users by username or email
    users = db.query(models.User).filter(
        or_(
            models.User.username.ilike(f"%{q}%"),
            models.User.email.ilike(f"%{q}%")
        )
    ).limit(limit).all()
    
    # Remove current user from results
    users = [user for user in users if user.id != current_user.id]
    
    return users

