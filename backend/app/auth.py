from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.config import settings
from app.cookies import read_access_token
from app.database import get_db
from app.models.user import User
from app.models.company import Company

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: int, company_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "company_id": company_id, "exp": expire},
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = read_access_token(request)
    if not token:
        raise credentials_error
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None:
        raise credentials_error
    return user


def get_current_company(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Company:
    company = db.get(Company, current_user.company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Entreprise introuvable")
    return company


def require_role(*allowed_roles: str):
    """
    Dependency factory : vérifie que l'utilisateur connecté a l'un des rôles autorisés.
    Usage : Depends(require_role("admin", "superadmin"))
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé — permissions insuffisantes",
            )
        return current_user
    return _check


def require_write_access(current_user: User = Depends(get_current_user)) -> User:
    """Bloque les utilisateurs readonly sur toute opération d'écriture."""
    if current_user.role == "readonly":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès en lecture seule",
        )
    return current_user
