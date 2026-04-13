import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.invitation import Invitation
from app.schemas.invitation import InviteCreate, InvitationOut, MemberOut, MemberRoleUpdate
from app.auth import require_role
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
    db.commit()
    db.refresh(invitation)
    return invitation


@router.patch("/{user_id}/role", response_model=MemberOut)
def update_member_role(
    user_id: int,
    body: MemberRoleUpdate,
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

    member.role = body.role
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{user_id}", status_code=204)
def remove_member(
    user_id: int,
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

    db.delete(member)
    db.commit()
