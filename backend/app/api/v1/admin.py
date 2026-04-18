import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.ride import Ride
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.settings import CompanySettings
from app.models.invitation import Invitation
from app.models.audit_log import AuditLog
from app.schemas.invitation import MemberOut, MemberRoleUpdate, CompanyOut
from app.auth import require_role, hash_password
from app.audit import log_action
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["superadmin"])


@router.get("/companies", response_model=List[CompanyOut])
def list_all_companies(
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    companies = db.query(Company).filter(Company.deleted_at.is_(None)).order_by(Company.created_at.desc()).all()
    if not companies:
        return []
    # Une seule requête pour tous les counts (évite N+1)
    counts = dict(
        db.query(User.company_id, func.count(User.id))
        .filter(User.company_id.in_([c.id for c in companies]))
        .group_by(User.company_id)
        .all()
    )
    result = []
    for c in companies:
        out = CompanyOut.model_validate(c)
        out.member_count = counts.get(c.id, 0)
        result.append(out)
    return result


@router.get("/companies/{company_id}/users", response_model=List[MemberOut])
def list_company_users(
    company_id: int,
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    return db.query(User).filter(User.company_id == company_id).all()


@router.delete("/companies/{company_id}", status_code=204)
def delete_company(
    company_id: int,
    request: Request,
    current_user: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.id == company_id, Company.deleted_at.is_(None)).first()
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    has_superadmin = db.query(User).filter(
        User.company_id == company_id, User.role == "superadmin"
    ).first()
    if has_superadmin:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une entreprise contenant un superadmin")

    # Soft-delete : marquer deleted_at au lieu de DROP. Les données restent pour audit/recovery.
    # La vraie purge sera faite par un cron séparé après un délai (ex. 30 jours).
    log_action(
        db, current_user, "soft_delete", "company",
        entity_id=company.id,
        details={"name": company.name, "email": company.email, "siret": company.siret},
        request=request,
    )
    company.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Impossible de réinitialiser un compte superadmin")
    temp_password = secrets.token_urlsafe(10)
    user.hashed_password = hash_password(temp_password)
    log_action(
        db, current_user, "reset_password", "user",
        entity_id=user.id,
        details={"target_email": user.email},
        request=request,
    )
    db.commit()
    return {"temporary_password": temp_password}


@router.patch("/users/{user_id}/role", response_model=MemberOut)
def update_user_role(
    user_id: int,
    body: MemberRoleUpdate,
    request: Request,
    current_user: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    if body.role not in ("admin", "manager", "readonly", "superadmin"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de modifier son propre rôle")
    old_role = user.role
    user.role = body.role
    log_action(
        db, current_user, "change_role", "user",
        entity_id=user.id,
        details={"target_email": user.email, "from": old_role, "to": body.role},
        request=request,
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats/global")
def global_stats(
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    """KPIs globaux pour dashboard superadmin (toutes entreprises confondues)."""
    total_companies = db.query(Company).filter(Company.deleted_at.is_(None)).count()
    deleted_companies = db.query(Company).filter(Company.deleted_at.isnot(None)).count()
    total_users = db.query(User).count()
    total_drivers = db.query(Driver).count()
    total_vehicles = db.query(Vehicle).count()
    total_rides = db.query(Ride).count()
    total_audit_logs = db.query(AuditLog).count()
    return {
        "companies": {"active": total_companies, "deleted": deleted_companies},
        "users": total_users,
        "drivers": total_drivers,
        "vehicles": total_vehicles,
        "rides": total_rides,
        "audit_logs": total_audit_logs,
    }


@router.get("/audit-logs")
def list_audit_logs(
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
    company_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    """Liste paginée des logs d'audit (superadmin). Filtres optionnels : company_id, action.
    Tri desc sur created_at. Limite 500 par requête."""
    limit = max(1, min(500, limit))
    offset = max(0, offset)
    q = db.query(AuditLog)
    if company_id is not None:
        q = q.filter(AuditLog.company_id == company_id)
    if action:
        q = q.filter(AuditLog.action == action)
    total = q.count()
    rows = q.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": r.id,
                "company_id": r.company_id,
                "user_id": r.user_id,
                "user_email": r.user_email,
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "details": r.details,
                "ip_address": r.ip_address,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }
