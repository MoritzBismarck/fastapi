# FASTAPI/app/routers/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import oauth2, models
from ..database import get_db
from ..services.chat_service import chat_manager
import jwt
from ..config import settings

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

async def get_current_user_websocket(websocket: WebSocket) -> int:
    """Extract user from WebSocket connection"""
    try:
        # Get token from query params
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="No token provided")
            return None
        
        # Verify token
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("user_id")
        return user_id
    except jwt.PyJWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return None

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    user_id = await get_current_user_websocket(websocket)
    if not user_id:
        return
    
    await chat_manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "join":
                await chat_manager.add_to_queue(user_id, data["role"])
                
            elif data["type"] == "publicKey":
                # Relay public key to partner
                session_id = chat_manager.user_sessions.get(user_id)
                if session_id:
                    session = chat_manager.active_sessions.get(session_id)
                    if session:
                        partner_id = (
                            session["helpseeker_id"] 
                            if user_id == session["caretaker_id"] 
                            else session["caretaker_id"]
                        )
                        await chat_manager.send_personal_message(
                            partner_id,
                            {
                                "type": "partnerPublicKey",
                                "key": data["key"]
                            }
                        )
            
            elif data["type"] == "encryptedMessage":
                await chat_manager.relay_encrypted_message(user_id, data["data"])
                
    except WebSocketDisconnect:
        chat_manager.disconnect(user_id)
        
    except Exception as e:
        print(f"WebSocket error: {e}")
        chat_manager.disconnect(user_id)