from sqlalchemy import or_
from .. import models, schemas, utils, oauth2
from fastapi import Body, FastAPI, Response, status, HTTPException, Depends, APIRouter
from ..database import engine, get_db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/", response_model=list[schemas.UserOut])
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
    
    return {
        "users": processed_users,
        "friends": established_friendships
    }

@router.post("/{invitation}", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #hash the password from user.password
    # invitation = db.query(models.Invitation).filter(models.Invitation.token == invitation).first()
    # if not invitation:
    #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invitation not found")
    hashed_password = utils.hash(user.password)
    user.password = hashed_password
    new_user = models.User(**user.model_dump())
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

