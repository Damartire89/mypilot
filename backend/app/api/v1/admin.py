import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.ride import Ride
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.schemas.invitation import MemberOut, MemberRoleUpdate, CompanyOut
from app.auth import require_role, hash_password
from typing import List

router = APIRouter(prefix="/admin", tags=["superadmin"])


@router.get("/companies", response_model=List[CompanyOut])
def list_all_companies(
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    companies = db.query(Company).order_by(Company.created_at.desc()).all()
    result = []
    for c in companies:
        member_count = db.query(User).filter(User.company_id == c.id).count()
        out = CompanyOut.model_validate(c)
        out.member_count = member_count
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
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    # Refus de supprimer une entreprise qui contient un superadmin
    has_superadmin = db.query(User).filter(
        User.company_id == company_id, User.role == "superadmin"
    ).first()
    if has_superadmin:
        raise HTTPException(status_code=400, detail="Impossible de supprimer une entreprise contenant un superadmin")
    db.query(Ride).filter(Ride.company_id == company_id).delete()
    db.query(Driver).filter(Driver.company_id == company_id).delete()
    db.query(Vehicle).filter(Vehicle.company_id == company_id).delete()
    db.query(User).filter(User.company_id == company_id).delete()
    db.delete(company)
    db.commit()


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    _: User = Depends(require_role("superadmin")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Impossible de réinitialiser un compte superadmin")
    temp_password = secrets.token_urlsafe(10)
    user.hashed_password = hash_password(temp_password)
    db.commit()
    return {"temporary_password": temp_password}


@router.patch("/users/{user_id}/role", response_model=MemberOut)
def update_user_role(
    user_id: int,
    body: MemberRoleUpdate,
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
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user
