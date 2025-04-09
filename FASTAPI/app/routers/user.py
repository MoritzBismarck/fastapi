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

