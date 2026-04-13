from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.invitation import Invitation
from app.models.user import User
from app.models.company import Company
from app.schemas.invitation import InvitationAccept
from app.schemas.auth import TokenResponse
from app.auth import hash_password, create_access_token

router = APIRouter(prefix="/invitations", tags=["invitations"])


def _get_valid_invitation(token: str, db: Session) -> Invitation:
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation introuvable")
    if invitation.used_at is not None:
        raise HTTPException(status_code=410, detail="Invitation déjà utilisée")
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Invitation expirée")
    return invitation


@router.get("/{token}")
def check_invitation(token: str, db: Session = Depends(get_db)):
    invitation = _get_valid_invitation(token, db)
    company = db.get(Company, invitation.company_id)
    return {
        "email": invitation.email,
        "role": invitation.role,
        "company_name": company.name if company else "",
        "expires_at": invitation.expires_at,
    }


@router.post("/{token}/accept", response_model=TokenResponse)
def accept_invitation(token: str, body: InvitationAccept, db: Session = Depends(get_db)):
    invitation = _get_valid_invitation(token, db)

    if db.query(User).filter(User.email == invitation.email).first():
        raise HTTPException(status_code=409, detail="Cet email est déjà associé à un compte")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 6 caractères")

    user = User(
        company_id=invitation.company_id,
        email=invitation.email,
        hashed_password=hash_password(body.password),
        role=invitation.role,
    )
    db.add(user)
    db.flush()

    invitation.used_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    company = db.get(Company, invitation.company_id)
    token_jwt = create_access_token(user.id, user.company_id)
    return TokenResponse(access_token=token_jwt, company_name=company.name)
