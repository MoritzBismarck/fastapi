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

# Update FASTAPI/app/routers/user.py - Replace the get_users_overview function

# Update FASTAPI/app/routers/user.py - Replace the get_users_overview function

# Replace your get_users_overview function in FASTAPI/app/routers/user.py with this fixed version:

# Replace your get_users_overview function with this version that ensures 
# friends-of-friends appear in suggested users:

@router.get("/overview", response_model=schemas.FriendsOverview)
def get_users_overview(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Get all friendships involving the current user
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.addressee_id == current_user.id
        )
    ).all()
    
    # Get current user's friends (accepted friendships)
    current_user_friends = set()
    for friendship in friendships:
        if friendship.status == "accepted":
            if friendship.requester_id == current_user.id:
                current_user_friends.add(friendship.addressee_id)
            else:
                current_user_friends.add(friendship.requester_id)
    
    # Get friends of friends (potential suggested users with mutual friends)
    friends_of_friends = set()
    if current_user_friends:
        # For each of current user's friends, get their friends
        for friend_id in current_user_friends:
            friend_friendships = db.query(models.Friendship).filter(
                and_(
                    or_(
                        models.Friendship.requester_id == friend_id,
                        models.Friendship.addressee_id == friend_id
                    ),
                    models.Friendship.status == "accepted"
                )
            ).all()
            
            for ff in friend_friendships:
                other_friend_id = ff.addressee_id if ff.requester_id == friend_id else ff.requester_id
                if other_friend_id != current_user.id and other_friend_id not in current_user_friends:
                    friends_of_friends.add(other_friend_id)
    
    # Get all users EXCEPT public users and the current user
    # PRIORITIZE friends of friends in the results
    suggested_user_ids = friends_of_friends if friends_of_friends else set()
    
    # Add other non-friend users to fill the suggestions
    all_other_users = db.query(models.User.id).filter(
        and_(
            models.User.id != current_user.id,
            models.User.is_public == False,
            ~models.User.id.in_(current_user_friends)  # Not already friends
        )
    ).all()
    
    for user_tuple in all_other_users:
        suggested_user_ids.add(user_tuple[0])
    
    # Get the actual user objects
    users = db.query(models.User).filter(
        models.User.id.in_(suggested_user_ids)
    ).all() if suggested_user_ids else []
    
    # Function to get mutual friends details
    def get_mutual_friends_details(user_id: int) -> list:
        if not current_user_friends:  # Current user has no friends
            return []
            
        # Get this user's friends
        user_friendships = db.query(models.Friendship).filter(
            and_(
                or_(
                    models.Friendship.requester_id == user_id,
                    models.Friendship.addressee_id == user_id
                ),
                models.Friendship.status == "accepted"
            )
        ).all()
        
        user_friends = set()
        for f in user_friendships:
            if f.requester_id == user_id:
                user_friends.add(f.addressee_id)
            else:
                user_friends.add(f.requester_id)
        
        # Get mutual friend IDs
        mutual_friend_ids = current_user_friends.intersection(user_friends)
        
        # Get mutual friend user details
        if not mutual_friend_ids:
            return []
            
        mutual_friends = db.query(models.User).filter(
            models.User.id.in_(mutual_friend_ids)
        ).all()
        
        return [{
            "id": friend.id,
            "username": friend.username,
            "first_name": friend.first_name,
            "last_name": friend.last_name,
            "profile_picture": friend.profile_picture
        } for friend in mutual_friends]
    
    # Process users to include relationship status and mutual friend details
    processed_users = []
    for user in users:
        # Find relationship with current user
        sent_friendship = next((f for f in friendships if f.requester_id == current_user.id and f.addressee_id == user.id), None)
        received_friendship = next((f for f in friendships if f.requester_id == user.id and f.addressee_id == current_user.id), None)
        
        # Skip if already friends - they'll be in the friends section
        if sent_friendship and sent_friendship.status == "accepted":
            continue
        if received_friendship and received_friendship.status == "accepted":
            continue
            
        # Determine relationship status
        if sent_friendship:
            if sent_friendship.status == "pending":
                relationship = "request_sent"
                friendship = sent_friendship
            else:  # rejected
                relationship = "none"
                friendship = None
        elif received_friendship:
            if received_friendship.status == "pending":
                relationship = "request_received"
                friendship = received_friendship
            else:  # rejected
                relationship = "none"
                friendship = None
        else:
            relationship = "none"
            friendship = None
        
        # Get mutual friends details
        mutual_friends = get_mutual_friends_details(user.id)
        
        # Check if they joined around the same time (within 24 hours)
        same_time_join = False
        if current_user.invitation_token_id and user.invitation_token_id:
            if current_user.invitation_token_id == user.invitation_token_id:
                time_diff = abs((user.created_at - current_user.created_at).total_seconds())
                same_time_join = time_diff <= 86400  # 24 hours in seconds
        
        processed_users.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at.isoformat(),
            "relationship": relationship,
            "friendshipId": friendship.id if friendship else None,
            "liked": bool(sent_friendship and sent_friendship.status == "pending"),
            "hasLikedCurrentUser": bool(received_friendship and received_friendship.status == "pending"),
            "mutual_friends": mutual_friends,
            "same_time_join": same_time_join
        })
    
    # Sort users: Those with most mutual friends first
    def sort_key(user):
        return (
            -len(user["mutual_friends"]),  # More mutual friends first
            not user["same_time_join"],    # Same time joiners first  
            user["username"].lower()       # Alphabetical
        )
    
    processed_users.sort(key=sort_key)
    
    # Get established friendships with mutual friend details
    established_friendships = []
    for f in friendships:
        if f.status == "accepted":
            friend_id = f.addressee_id if f.requester_id == current_user.id else f.requester_id
            friend = db.query(models.User).filter(models.User.id == friend_id).first()
            
            if friend:
                friend_mutual_friends = get_mutual_friends_details(friend.id)
                
                established_friendships.append({
                    "id": f.id,
                    "friend": {
                        "id": friend.id,
                        "username": friend.username,
                        "email": friend.email,
                        "first_name": friend.first_name,
                        "last_name": friend.last_name,
                        "profile_picture": friend.profile_picture,
                        "mutual_friends": friend_mutual_friends
                    },
                    "status": f.status,
                    "created_at": f.created_at.isoformat(),
                    "updated_at": f.updated_at.isoformat()
                })
    
    established_friendships.sort(key=lambda f: -len(f["friend"]["mutual_friends"]))
    
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

    user_data["is_public"] = False
    
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

# Add this to FASTAPI/app/routers/user.py

# Add this to FASTAPI/app/routers/user.py

@router.get("/{user_id}/profile", response_model=schemas.UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get a specific user's profile with relationship status and mutual friends"""
    
    # Get the target user
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # Don't allow viewing public users or own profile through this endpoint
    if target_user.is_public or target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view this user's profile"
        )
    
    # Get friendship status
    friendship = db.query(models.Friendship).filter(
        or_(
            and_(
                models.Friendship.requester_id == current_user.id,
                models.Friendship.addressee_id == user_id
            ),
            and_(
                models.Friendship.requester_id == user_id,
                models.Friendship.addressee_id == current_user.id
            )
        )
    ).first()
    
    # Determine relationship status
    relationship = "none"
    friendship_id = None
    
    if friendship:
        friendship_id = friendship.id
        if friendship.status == "accepted":
            relationship = "friends"
        elif friendship.status == "pending":
            if friendship.requester_id == current_user.id:
                relationship = "request_sent"
            else:
                relationship = "request_received"
    
    # Get current user's friends
    current_user_friendships = db.query(models.Friendship).filter(
        and_(
            or_(
                models.Friendship.requester_id == current_user.id,
                models.Friendship.addressee_id == current_user.id
            ),
            models.Friendship.status == "accepted"
        )
    ).all()
    
    current_user_friends = set()
    for f in current_user_friendships:
        if f.requester_id == current_user.id:
            current_user_friends.add(f.addressee_id)
        else:
            current_user_friends.add(f.requester_id)
    
    # Get target user's friends
    target_user_friendships = db.query(models.Friendship).filter(
        and_(
            or_(
                models.Friendship.requester_id == user_id,
                models.Friendship.addressee_id == user_id
            ),
            models.Friendship.status == "accepted"
        )
    ).all()
    
    target_user_friends = set()
    for f in target_user_friendships:
        if f.requester_id == user_id:
            target_user_friends.add(f.addressee_id)
        else:
            target_user_friends.add(f.requester_id)
    
    # Get mutual friend IDs and details
    mutual_friend_ids = current_user_friends.intersection(target_user_friends)
    
    mutual_friends = []
    if mutual_friend_ids:
        mutual_friends_users = db.query(models.User).filter(
            models.User.id.in_(mutual_friend_ids)
        ).all()
        
        mutual_friends = [{
            "id": friend.id,
            "username": friend.username,
            "first_name": friend.first_name,
            "last_name": friend.last_name,
            "profile_picture": friend.profile_picture
        } for friend in mutual_friends_users]
    
    return {
        "id": target_user.id,
        "username": target_user.username,
        "email": target_user.email,
        "first_name": target_user.first_name,
        "last_name": target_user.last_name,
        "profile_picture": target_user.profile_picture,
        "created_at": target_user.created_at.isoformat(),
        "mutual_friends": mutual_friends,
        "relationship": relationship,
        "friendshipId": friendship_id
    }