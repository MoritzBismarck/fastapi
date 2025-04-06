from fastapi import APIRouter, Depends, HTTPException, status, Response, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..services.token_service import TokenService

from .. import database, schemas, models, utils, oauth2

router = APIRouter(
    tags=["auth"]
)

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    if not user:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    
    if not utils.verify(user_credentials.password, user.password):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    # generate jwt token
    access_token = oauth2.create_access_token(data={"user_id":user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    authorization: str = Header(...),
    current_user: int = Depends(oauth2.get_current_user)
):
    # Extract token from Authorization header
    try:
        token_type, token = authorization.split()
        if token_type.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Blacklist the token
    success = TokenService.blacklist_token(token)
    
    if not success:
        return {"message": "Token invalidation failed", "success": False}
    
    return {"message": "Successfully logged out", "success": True}
