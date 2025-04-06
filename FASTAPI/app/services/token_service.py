import jwt
from datetime import datetime
from ..database import redis_client
from ..config import settings

class TokenService:
    """Service for handling JWT token operations including blacklisting"""
    
    @staticmethod
    def blacklist_token(token: str):
        """Add a token to the blacklist"""
        try:
            # Decode the token to get the expiration time
            payload = jwt.decode(
                token, 
                settings.secret_key, 
                algorithms=[settings.algorithm]
            )
            
            # Get expiration timestamp
            exp_timestamp = payload.get('exp')
            
            if not exp_timestamp:
                return False
                
            # Calculate remaining time until token expiration
            current_timestamp = datetime.now().timestamp()
            ttl = max(1, int(exp_timestamp - current_timestamp))
            
            # Store token in Redis with TTL
            redis_key = f"blacklist:{token}"
            redis_client.setex(redis_key, ttl, 1)
            
            return True
        except jwt.PyJWTError:
            # If token is invalid, return False
            return False
    
    @staticmethod
    def is_blacklisted(token: str) -> bool:
        """Check if a token is blacklisted"""
        redis_key = f"blacklist:{token}"
        return bool(redis_client.exists(redis_key))