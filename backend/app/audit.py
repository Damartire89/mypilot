"""Helper pour tracer les actions sensibles dans audit_logs."""
import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import Request
from app.models.audit_log import AuditLog
from app.models.user import User


def log_action(
    db: Session,
    user: Optional[User],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
) -> None:
    """Enregistre une action sensible. À appeler AVANT db.commit() de l'opération principale."""
    ip = None
    if request is not None:
        ip = request.client.host if request.client else None
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()

    entry = AuditLog(
        company_id=user.company_id if user else None,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details, default=str) if details else None,
        ip_address=ip,
    )
    db.add(entry)
