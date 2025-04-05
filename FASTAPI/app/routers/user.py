from .. import models, schemas, utils
from fastapi import Body, FastAPI, Response, status, HTTPException, Depends, APIRouter
from ..database import engine, get_db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/{invitation}", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #hash the password from user.password
    invitation = db.query(models.Invitation).filter(models.Invitation.token == invitation).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invitation not found")
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

