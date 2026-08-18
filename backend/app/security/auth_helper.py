import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.database.session import get_db
from app.models.models import User, Session as UserSession

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

SESSION_COOKIE_NAME = "vaultops_session"
SESSION_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

def create_user_session(db: Session, user_id: str, request: Request) -> str:
    # Generate secure random session token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Session lifetime
    expires_at = datetime.utcnow() + timedelta(minutes=SESSION_EXPIRE_MINUTES)
    
    # Gather device details
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else "127.0.0.1"
    
    # Parse simple browser/device info from user-agent
    browser_info = "Unknown Browser"
    device_info = "Unknown Device"
    if "Chrome" in user_agent:
        browser_info = "Chrome"
    elif "Safari" in user_agent:
        browser_info = "Safari"
    elif "Firefox" in user_agent:
        browser_info = "Firefox"
    
    if "Windows" in user_agent:
        device_info = "Windows PC"
    elif "Macintosh" in user_agent:
        device_info = "Mac"
    elif "iPhone" in user_agent:
        device_info = "iPhone"
    elif "Linux" in user_agent:
        device_info = "Linux Server"
        
    db_session = UserSession(
        user_id=user_id,
        token_hash=token_hash,
        device_info=device_info,
        browser_info=browser_info,
        ip_address=ip_address,
        expires_at=expires_at,
        is_active=True
    )
    
    db.add(db_session)
    db.commit()
    return token

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # For initial Phase 1 ease, if no session is set, check if we can fall back
    # But let's check the cookie first.
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        # Fallback to demo user for development/preview if cookie not sent
        # so frontend doesn't crash on initial load before login page integration.
        demo_user = db.query(User).filter(User.email == "demo@vaultops.io").first()
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
        
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db_session = db.query(UserSession).filter(
        UserSession.token_hash == token_hash,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if not db_session:
        # Clear invalid session
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
        
    # Update last active timestamp
    db_session.last_active = datetime.utcnow()
    db.commit()
    
    return db_session.user
