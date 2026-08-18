import logging
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.models import AuditLog

logger = logging.getLogger(__name__)

def log_action(
    db: Session,
    user_id: str,
    action: str,
    request: Request = None,
    details: dict = None
):
    """Creates a database audit log and prints a secure structured log."""
    ip_address = "127.0.0.1"
    user_agent = "System"
    
    if request:
        ip_address = request.client.host if request.client else "127.0.0.1"
        user_agent = request.headers.get("user-agent", "Unknown")

    # Sanitize details to ensure no credentials or secrets are present
    safe_details = {}
    if details:
        for k, v in details.items():
            if any(secret_word in k.lower() for secret_word in ["password", "secret", "token", "key", "body", "content", "email"]):
                safe_details[k] = "[REDACTED]"
            else:
                safe_details[k] = v

    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent[:255] if user_agent else None,
            details=safe_details
        )
        db.add(audit_entry)
        db.commit()
        
        # Structured log for central logging systems (e.g. Loki)
        logger.info(f"AUDIT_LOG | User: {user_id} | Action: {action} | IP: {ip_address} | Details: {safe_details}")
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
        db.rollback()
