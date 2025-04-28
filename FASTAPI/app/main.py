from fastapi import Body, FastAPI
from . import models
from .database import engine
from .routers import post, user, auth, friendship, event, notification, invitation
from pydantic_settings import BaseSettings
from .config import Settings
from fastapi.middleware.cors import CORSMiddleware


# models.Base.metadata.create_all(bind=engine)

app = FastAPI() # FastAPI Instance is created allowing us to use the FastAPI methods

origins = ["*"] # list of origins that are allowed to access the backend

app.add_middleware( #function that runs before the request is processed needed to allow the frontend to access the backend
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(post.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(friendship.router)
app.include_router(event.router)
app.include_router(notification.router)
app.include_router(invitation.router)

@app.get("/")
def root():
    return {"Een Websteed ut Beers"}


