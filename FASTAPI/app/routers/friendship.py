# Create a new file: FASTAPI/app/routers/friendship.py

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, oauth2
from ..database import get_db
from sqlalchemy import or_, and_

router = APIRouter(
    prefix="/friendships",
    tags=["friendships"]
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.FriendshipOut)
def create_friendship_request(
    friendship: schemas.FriendshipCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Check if the addressee exists
    addressee = db.query(models.User).filter(models.User.id == friendship.addressee_id).first()
    if not addressee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {friendship.addressee_id} not found"
        )
    
    # Check if the requester is trying to add themselves
    if current_user.id == friendship.addressee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send a friend request to yourself"
        )
    
    # Check if a friendship already exists between these users
    existing_friendship = db.query(models.Friendship).filter(
        or_(
            and_(
                models.Friendship.requester_id == current_user.id,
                models.Friendship.addressee_id == friendship.addressee_id
            ),
            and_(
                models.Friendship.requester_id == friendship.addressee_id,
                models.Friendship.addressee_id == current_user.id
            )
        )
    ).first()
    
    if existing_friendship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A friendship request already exists between these users"
        )
    
    # Create the friendship request
    new_friendship = models.Friendship(
        requester_id=current_user.id,
        addressee_id=friendship.addressee_id,
        status="pending"
    )
    
    db.add(new_friendship)
    db.commit()
    db.refresh(new_friendship)
    
    return new_friendship

@router.put("/{id}", response_model=schemas.FriendshipOut)
def update_friendship_status(
    id: int, 
    friendship_update: schemas.FriendshipUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # Validate the status
    valid_statuses = ["accepted", "rejected"]
    if friendship_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {', '.join(valid_statuses)}"
        )
    
    # Get the friendship
    friendship_query = db.query(models.Friendship).filter(models.Friendship.id == id)
    friendship = friendship_query.first()
    
    # Check if friendship exists
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Friendship with id {id} not found"
        )
    
    # Check if the current user is the addressee of the friendship request
    if friendship.addressee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update friendship requests sent to you"
        )
    
    # Check if the friendship is still pending
    if friendship.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Friendship is already {friendship.status}"
        )
    
    # Update the friendship status
    friendship_query.update({"status": friendship_update.status})
    db.commit()
    
    return friendship_query.first()

@router.get("/", response_model=List[schemas.FriendshipWithDetails])
def get_user_friendships(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    status: str = None
):
    # Base query for friendships where the current user is either the requester or addressee
    query = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == current_user.id,
            models.Friendship.addressee_id == current_user.id
        )
    )
    
    # Filter by status if provided
    if status:
        query = query.filter(models.Friendship.status == status)
    
    friendships = query.all()
    
    # Format the response to include user details
    result = []
    for friendship in friendships:
        # Determine which user is the "friend" (the other person in the friendship)
        friend_id = friendship.addressee_id if friendship.requester_id == current_user.id else friendship.requester_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        
        friendship_with_details = {
            "id": friendship.id,
            "status": friendship.status,
            "created_at": friendship.created_at,
            "updated_at": friendship.updated_at,
            "friend": friend
        }
        result.append(friendship_with_details)
    
    return result

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friendship(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    friendship_query = db.query(models.Friendship).filter(models.Friendship.id == id)
    friendship = friendship_query.first()
    
    # Check if friendship exists
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Friendship with id {id} not found"
        )
    
    # Check if the current user is part of the friendship
    if friendship.requester_id != current_user.id and friendship.addressee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own friendships"
        )
    
    # Delete the friendship
    friendship_query.delete(synchronize_session=False)
    db.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)