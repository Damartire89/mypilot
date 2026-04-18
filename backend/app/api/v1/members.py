import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.invitation import Invitation
from app.schemas.invitation import InviteCreate, InvitationOut, MemberOut, MemberRoleUpdate
from app.auth import require_role
from app.audit import log_action
from typing import List

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=List[MemberOut])
def list_members(
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    return db.query(User).filter(User.company_id == current_user.company_id).all()


@router.post("/invite", response_model=InvitationOut, status_code=201)
def invite_member(
    body: InviteCreate,
    request: Request,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    if body.role not in ("admin", "manager", "readonly"):
        raise HTTPException(status_code=400, detail="Rôle invalide")

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Cet email est déjà associé à un compte")

    # Supprimer une éventuelle invitation non utilisée pour le même email
    existing = db.query(Invitation).filter(
        Invitation.email == body.email,
        Invitation.company_id == current_user.company_id,
        Invitation.used_at.is_(None),
    ).first()
    if existing:
        db.delete(existing)

    invitation = Invitation(
        company_id=current_user.company_id,
        email=body.email,
        role=body.role,
        token=secrets.token_urlsafe(32),
        created_by=current_user.id,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=7),
    )
    db.add(invitation)
    log_action(
        db, current_user, "invite", "user",
        details={"invited_email": body.email, "role": body.role},
        request=request,
    )
    db.commit()
    db.refresh(invitation)
    return invitation


@router.patch("/{user_id}/role", response_model=MemberOut)
def update_member_role(
    user_id: int,
    body: MemberRoleUpdate,
    request: Request,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    if body.role not in ("admin", "manager", "readonly"):
        raise HTTPException(status_code=400, detail="Rôle invalide")

    member = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    if member.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de modifier son propre rôle")

    old_role = member.role
    member.role = body.role
    log_action(
        db, current_user, "change_role", "user",
        entity_id=member.id,
        details={"target_email": member.email, "from": old_role, "to": body.role},
        request=request,
    )
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{user_id}", status_code=204)
def remove_member(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role("admin", "superadmin")),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    if member.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de se supprimer soi-même")

    log_action(
        db, current_user, "delete", "user",
        entity_id=member.id,
        details={"target_email": member.email, "role": member.role},
        request=request,
    )
    db.delete(member)
    db.commit()
