# FASTAPI/app/services/chat_service.py
from typing import Dict, Optional, Set
from fastapi import WebSocket
from datetime import datetime, timedelta
import asyncio
import json
import uuid

class ConnectionManager:
    def __init__(self):
        # Active WebSocket connections
        self.active_connections: Dict[int, WebSocket] = {}
        
        # Queues for matching
        self.caretaker_queue: Set[int] = set()
        self.helpseeker_queue: Set[int] = set()
        
        # Active sessions
        self.active_sessions: Dict[str, Dict] = {}
        
        # User to session mapping
        self.user_sessions: Dict[int, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    def disconnect(self, user_id: int):
        # Remove from queues
        self.caretaker_queue.discard(user_id)
        self.helpseeker_queue.discard(user_id)
        
        # End any active session
        session_id = self.user_sessions.get(user_id)
        if session_id:
            asyncio.create_task(self.end_session(session_id, reason="disconnect"))
        
        # Remove connection
        self.active_connections.pop(user_id, None)
    
    async def add_to_queue(self, user_id: int, role: str):
        if role == "caretaker":
            self.caretaker_queue.add(user_id)
        else:
            self.helpseeker_queue.add(user_id)
        
        # Try to match
        await self.try_match()
    
    async def try_match(self):
        if self.caretaker_queue and self.helpseeker_queue:
            # Get one from each queue
            caretaker_id = self.caretaker_queue.pop()
            helpseeker_id = self.helpseeker_queue.pop()
            
            # Create session
            session_id = str(uuid.uuid4())
            self.active_sessions[session_id] = {
                "caretaker_id": caretaker_id,
                "helpseeker_id": helpseeker_id,
                "started_at": datetime.now(),
                "duration": 300  # 5 minutes in seconds
            }
            
            self.user_sessions[caretaker_id] = session_id
            self.user_sessions[helpseeker_id] = session_id
            
            # Notify both users
            await self.send_personal_message(
                caretaker_id,
                {
                    "type": "matched",
                    "role": "caretaker",
                    "sessionId": session_id
                }
            )
            
            await self.send_personal_message(
                helpseeker_id,
                {
                    "type": "matched",
                    "role": "helpseeker",
                    "sessionId": session_id
                }
            )
            
            # Start session timer
            asyncio.create_task(self.session_timer(session_id))
    
    async def session_timer(self, session_id: str):
        """5-minute countdown timer for the session"""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        
        end_time = session["started_at"] + timedelta(seconds=session["duration"])
        
        while datetime.now() < end_time:
            remaining = int((end_time - datetime.now()).total_seconds())
            
            # Send timer update every 10 seconds
            if remaining % 10 == 0:
                await self.broadcast_to_session(
                    session_id,
                    {
                        "type": "timerUpdate",
                        "remainingSeconds": remaining
                    }
                )
            
            await asyncio.sleep(1)
        
        # Time's up
        await self.end_session(session_id, reason="timeout")
    
    async def end_session(self, session_id: str, reason: str):
        session = self.active_sessions.get(session_id)
        if not session:
            return
        
        # Notify both users
        await self.broadcast_to_session(
            session_id,
            {
                "type": "sessionEnd",
                "reason": reason
            }
        )
        
        # Clean up
        self.user_sessions.pop(session["caretaker_id"], None)
        self.user_sessions.pop(session["helpseeker_id"], None)
        self.active_sessions.pop(session_id, None)
    
    async def send_personal_message(self, user_id: int, message: dict):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)
    
    async def broadcast_to_session(self, session_id: str, message: dict):
        session = self.active_sessions.get(session_id)
        if session:
            await self.send_personal_message(session["caretaker_id"], message)
            await self.send_personal_message(session["helpseeker_id"], message)
    
    async def relay_encrypted_message(self, sender_id: int, encrypted_data: str):
        session_id = self.user_sessions.get(sender_id)
        if not session_id:
            return
        
        session = self.active_sessions.get(session_id)
        if not session:
            return
        
        # Determine recipient
        recipient_id = (
            session["helpseeker_id"] 
            if sender_id == session["caretaker_id"] 
            else session["caretaker_id"]
        )
        
        # Relay encrypted message
        await self.send_personal_message(
            recipient_id,
            {
                "type": "partnerEncryptedMessage",
                "data": encrypted_data
            }
        )

# Global instance
chat_manager = ConnectionManager()