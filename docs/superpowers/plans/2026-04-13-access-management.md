# Access Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système complet de gestion des accès — panel superadmin global + invitations membres avec rôles par entreprise.

**Architecture:** Extension minimale du modèle existant — ajout du rôle `superadmin` dans `users`, nouvelle table `invitations`, deux nouveaux routers FastAPI (`/admin`, `/members`, `/invitations`), middleware de rôles sur les endpoints existants, et pages React correspondantes.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic (backend) — React 18 + Vite + Axios (frontend, JSX)

---

## Structure des fichiers

### Backend — créer
- `backend/app/models/invitation.py` — modèle SQLAlchemy `Invitation`
- `backend/app/schemas/invitation.py` — schémas Pydantic pour invitations et membres
- `backend/app/api/v1/admin.py` — router superadmin
- `backend/app/api/v1/members.py` — router membres entreprise
- `backend/app/api/v1/invitations.py` — router public invitations
- `backend/migrations/versions/xxxx_add_invitations_and_roles.py` — migration Alembic

### Backend — modifier
- `backend/app/auth.py` — ajouter `require_role()` dependency
- `backend/app/api/v1/rides.py` — protéger POST/PATCH/DELETE avec `require_role`
- `backend/app/api/v1/drivers.py` — idem
- `backend/app/api/v1/vehicles.py` — idem
- `backend/app/api/v1/settings.py` — idem + bloquer `manager` et `readonly`
- `backend/app/main.py` — enregistrer les 3 nouveaux routers
- `backend/seed_demo.py` — ajouter création compte superadmin

### Frontend — créer
- `frontend/src/pages/SuperAdmin.jsx` — panel superadmin
- `frontend/src/pages/InviteAccept.jsx` — page acceptation invitation
- `frontend/src/api/members.js` — appels API membres
- `frontend/src/api/admin.js` — appels API superadmin

### Frontend — modifier
- `frontend/src/context/AuthContext.jsx` — exposer `user.role` depuis le JWT décodé
- `frontend/src/App.jsx` — ajouter routes `/superadmin` et `/invite/:token`
- `frontend/src/pages/Settings.jsx` — ajouter onglet "Équipe"
- `frontend/src/components/Sidebar.jsx` (ou équivalent) — lien superadmin conditionnel

---

## Task 1 : Migration Alembic — table invitations + colonne role étendue

**Files:**
- Create: `backend/migrations/versions/d4e5f6a7b8c9_add_invitations_and_superadmin_role.py`

- [ ] **Step 1 : Créer la migration manuellement**

```python
# backend/migrations/versions/d4e5f6a7b8c9_add_invitations_and_superadmin_role.py
"""add_invitations_and_superadmin_role

Revision ID: d4e5f6a7b8c9
Revises: c3d1a7e8f921
Create Date: 2026-04-13 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d1a7e8f921'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invitations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='manager'),
        sa.Column('token', sa.String(64), nullable=False, unique=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_invitations_token', 'invitations', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_invitations_token', 'invitations')
    op.drop_table('invitations')
```

- [ ] **Step 2 : Appliquer la migration**

```bash
cd backend
./venv/Scripts/python -m alembic upgrade head
```

Expected output :
```
INFO  [alembic.runtime.migration] Running upgrade c3d1a7e8f921 -> d4e5f6a7b8c9, add_invitations_and_superadmin_role
```

- [ ] **Step 3 : Commit**

```bash
git add backend/migrations/versions/d4e5f6a7b8c9_add_invitations_and_superadmin_role.py
git commit -m "feat: migration add invitations table and superadmin role"
```

---

## Task 2 : Modèle SQLAlchemy Invitation

**Files:**
- Create: `backend/app/models/invitation.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1 : Créer le modèle**

```python
# backend/app/models/invitation.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False, default="manager")
    token = Column(String(64), nullable=False, unique=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 2 : Vérifier que le modèle s'importe correctement**

```bash
cd backend
./venv/Scripts/python -c "from app.models.invitation import Invitation; print('OK')"
```

Expected: `OK`

- [ ] **Step 3 : Commit**

```bash
git add backend/app/models/invitation.py
git commit -m "feat: add Invitation SQLAlchemy model"
```

---

## Task 3 : Middleware de rôles dans auth.py

**Files:**
- Modify: `backend/app/auth.py`

- [ ] **Step 1 : Ajouter `require_role` dans auth.py**

Ouvrir `backend/app/auth.py` et ajouter à la fin :

```python
from functools import partial
from typing import List


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
```

- [ ] **Step 2 : Vérifier l'import**

```bash
cd backend
./venv/Scripts/python -c "from app.auth import require_role, require_write_access; print('OK')"
```

Expected: `OK`

- [ ] **Step 3 : Commit**

```bash
git add backend/app/auth.py
git commit -m "feat: add require_role and require_write_access dependencies"
```

---

## Task 4 : Protéger les endpoints existants avec require_write_access

**Files:**
- Modify: `backend/app/api/v1/rides.py`
- Modify: `backend/app/api/v1/drivers.py`
- Modify: `backend/app/api/v1/vehicles.py`
- Modify: `backend/app/api/v1/settings.py`

- [ ] **Step 1 : Modifier rides.py — ajouter require_write_access sur POST/PATCH/DELETE**

Dans `backend/app/api/v1/rides.py`, modifier l'import :
```python
from app.auth import get_current_company, require_write_access
```

Modifier les 3 endpoints d'écriture :
```python
@router.post("", response_model=RideOut, status_code=201)
def create_ride(
    body: RideCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    _: User = Depends(require_write_access),
):
    ride = Ride(**body.model_dump(), company_id=company.id)
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.patch("/{ride_id}", response_model=RideOut)
def update_ride(
    ride_id: int,
    body: RideUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    _: User = Depends(require_write_access),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ride, field, value)
    db.commit()
    db.refresh(ride)
    return ride


@router.delete("/{ride_id}", status_code=204)
def delete_ride(
    ride_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    _: User = Depends(require_write_access),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")
    db.delete(ride)
    db.commit()
```

Ajouter également l'import User en haut :
```python
from app.models.user import User
```

- [ ] **Step 2 : Appliquer le même pattern à drivers.py**

Dans `backend/app/api/v1/drivers.py`, ajouter l'import :
```python
from app.auth import get_current_company, require_write_access
from app.models.user import User
```

Ajouter `_: User = Depends(require_write_access)` sur tous les POST, PATCH, DELETE.

- [ ] **Step 3 : Appliquer le même pattern à vehicles.py**

Dans `backend/app/api/v1/vehicles.py`, ajouter l'import :
```python
from app.auth import get_current_company, require_write_access
from app.models.user import User
```

Ajouter `_: User = Depends(require_write_access)` sur tous les POST, PATCH, DELETE.

- [ ] **Step 4 : Protéger settings.py — bloquer manager et readonly**

Dans `backend/app/api/v1/settings.py`, ajouter l'import :
```python
from app.auth import get_current_company, require_role
from app.models.user import User
```

Sur tous les endpoints de settings (GET et PUT), remplacer la dépendance par :
```python
_: User = Depends(require_role("admin", "superadmin"))
```

- [ ] **Step 5 : Vérifier que le backend démarre sans erreur**

```bash
cd backend
./venv/Scripts/python -m uvicorn app.main:app --port 8002 --reload
```

Expected: `Application startup complete.`

- [ ] **Step 6 : Commit**

```bash
git add backend/app/api/v1/rides.py backend/app/api/v1/drivers.py backend/app/api/v1/vehicles.py backend/app/api/v1/settings.py
git commit -m "feat: enforce role-based write access on existing endpoints"
```

---

## Task 5 : Schémas Pydantic pour invitations et membres

**Files:**
- Create: `backend/app/schemas/invitation.py`

- [ ] **Step 1 : Créer les schémas**

```python
# backend/app/schemas/invitation.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class InviteCreate(BaseModel):
    email: EmailStr
    role: str  # manager | readonly | admin


class InvitationOut(BaseModel):
    id: int
    email: str
    role: str
    token: str
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    password: str
    full_name: Optional[str] = None


class MemberOut(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemberRoleUpdate(BaseModel):
    role: str  # admin | manager | readonly


class CompanyOut(BaseModel):
    id: int
    name: str
    email: str
    activity_type: str
    created_at: datetime
    member_count: int = 0

    class Config:
        from_attributes = True
```

- [ ] **Step 2 : Vérifier l'import**

```bash
cd backend
./venv/Scripts/python -c "from app.schemas.invitation import InviteCreate, MemberOut, CompanyOut; print('OK')"
```

Expected: `OK`

- [ ] **Step 3 : Commit**

```bash
git add backend/app/schemas/invitation.py
git commit -m "feat: add invitation and member Pydantic schemas"
```

---

## Task 6 : Router /members

**Files:**
- Create: `backend/app/api/v1/members.py`

- [ ] **Step 1 : Créer le router**

```python
# backend/app/api/v1/members.py
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.invitation import Invitation
from app.schemas.invitation import InviteCreate, InvitationOut, MemberOut, MemberRoleUpdate
from app.auth import get_current_user, require_role
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

    # Vérifier que l'email n'est pas déjà un utilisateur
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
        expires_at=datetime.utcnow() + timedelta(days=7),
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
```

- [ ] **Step 2 : Commit**

```bash
git add backend/app/api/v1/members.py
git commit -m "feat: add /members router (list, invite, update role, remove)"
```

---

## Task 7 : Router /invitations (public)

**Files:**
- Create: `backend/app/api/v1/invitations.py`

- [ ] **Step 1 : Créer le router**

```python
# backend/app/api/v1/invitations.py
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
```

- [ ] **Step 2 : Commit**

```bash
git add backend/app/api/v1/invitations.py
git commit -m "feat: add /invitations public router (check + accept)"
```

---

## Task 8 : Router /admin (superadmin)

**Files:**
- Create: `backend/app/api/v1/admin.py`

- [ ] **Step 1 : Créer le router**

```python
# backend/app/api/v1/admin.py
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
    # Suppression en cascade des données liées
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
```

- [ ] **Step 2 : Commit**

```bash
git add backend/app/api/v1/admin.py
git commit -m "feat: add /admin router for superadmin management"
```

---

## Task 9 : Enregistrer les nouveaux routers dans main.py

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1 : Modifier main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, drivers, rides, settings, vehicles, members, invitations, admin
from app.config import settings as app_settings

app = FastAPI(title="myPilot API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(rides.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(members.router, prefix="/api/v1")
app.include_router(invitations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "app": "myPilot"}
```

- [ ] **Step 2 : Vérifier que le backend démarre**

```bash
cd backend
./venv/Scripts/python -m uvicorn app.main:app --port 8002
```

Expected: `Application startup complete.` sans erreur

- [ ] **Step 3 : Vérifier les routes dans Swagger**

Ouvrir http://localhost:8002/docs — vérifier la présence des sections `members`, `invitations`, `superadmin`.

- [ ] **Step 4 : Commit**

```bash
git add backend/app/main.py
git commit -m "feat: register members, invitations, admin routers"
```

---

## Task 10 : Créer le compte superadmin via seed_demo.py

**Files:**
- Modify: `backend/seed_demo.py`

- [ ] **Step 1 : Ajouter la création du superadmin dans seed_demo.py**

Ajouter après la création de l'entreprise démo, avant `db.commit()` final :

```python
import os

# Compte superadmin (une seule entreprise "système")
SUPERADMIN_EMAIL = os.environ.get("SUPERADMIN_EMAIL", "admin@mypilot.app")
SUPERADMIN_PASSWORD = os.environ.get("SUPERADMIN_PASSWORD", "superadmin2026!")

# Créer une entreprise système pour le superadmin s'il n'existe pas
sys_company = db.query(Company).filter(Company.email == SUPERADMIN_EMAIL).first()
if not sys_company:
    sys_company = Company(
        name="myPilot — Admin",
        email=SUPERADMIN_EMAIL,
        activity_type="taxi",
    )
    db.add(sys_company)
    db.flush()

existing_superadmin = db.query(User).filter(User.email == SUPERADMIN_EMAIL).first()
if not existing_superadmin:
    superadmin = User(
        company_id=sys_company.id,
        email=SUPERADMIN_EMAIL,
        hashed_password=hash_password(SUPERADMIN_PASSWORD),
        role="superadmin",
    )
    db.add(superadmin)
    print(f"\nSuperadmin créé : {SUPERADMIN_EMAIL} / {SUPERADMIN_PASSWORD}")
else:
    print(f"\nSuperadmin existant : {SUPERADMIN_EMAIL}")
```

- [ ] **Step 2 : Lancer le seed**

```bash
cd backend
./venv/Scripts/python seed_demo.py
```

Expected output (entre autres) :
```
Superadmin créé : admin@mypilot.app / superadmin2026!
```

- [ ] **Step 3 : Commit**

```bash
git add backend/seed_demo.py
git commit -m "feat: add superadmin account creation in seed_demo"
```

---

## Task 11 : AuthContext — exposer le rôle utilisateur

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1 : Décoder le JWT pour extraire le rôle**

Le JWT actuel contient `sub` (user_id) et `company_id`. Il faut aussi y inclure le `role`. Deux options : décoder le JWT côté frontend, ou ajouter un endpoint `/auth/me`.

**Option choisie : endpoint `/auth/me`** — plus robuste.

Ajouter dans `backend/app/api/v1/auth.py` :

```python
class MeResponse(BaseModel):
    id: int
    email: str
    role: str
    company_id: int
    company_name: str

    class Config:
        from_attributes = True

@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.get(Company, current_user.company_id)
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        company_id=current_user.company_id,
        company_name=company.name if company else "",
    )
```

- [ ] **Step 2 : Mettre à jour AuthContext pour stocker et exposer le rôle**

```jsx
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem("company")); } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  // Charger le profil utilisateur si token présent mais user absent
  useEffect(() => {
    if (token && !user) {
      client.get("/api/v1/auth/me")
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => signOut());
    }
  }, [token]);

  function signIn(tokenValue, companyData, userData = null) {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("company", JSON.stringify(companyData));
    setToken(tokenValue);
    setCompany(companyData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  }

  function signOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    localStorage.removeItem("user");
    setToken(null);
    setCompany(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, company, user, signIn, signOut, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 3 : Mettre à jour Login.jsx pour appeler /me après connexion**

Dans `frontend/src/pages/Login.jsx`, après le login réussi, appeler `/auth/me` et passer le résultat à `signIn` :

```jsx
// Dans la fonction handleSubmit, après login() :
const meRes = await client.get("/api/v1/auth/me");
signIn(data.access_token, { name: data.company_name }, meRes.data);
```

- [ ] **Step 4 : Commit**

```bash
git add backend/app/api/v1/auth.py frontend/src/context/AuthContext.jsx frontend/src/pages/Login.jsx
git commit -m "feat: expose user role via /auth/me and AuthContext"
```

---

## Task 12 : Frontend — page SuperAdmin

**Files:**
- Create: `frontend/src/pages/SuperAdmin.jsx`
- Create: `frontend/src/api/admin.js`

- [ ] **Step 1 : Créer l'API admin**

```js
// frontend/src/api/admin.js
import client from "./client";

export async function getCompanies() {
  const { data } = await client.get("/api/v1/admin/companies");
  return data;
}

export async function getCompanyUsers(companyId) {
  const { data } = await client.get(`/api/v1/admin/companies/${companyId}/users`);
  return data;
}

export async function deleteCompany(companyId) {
  await client.delete(`/api/v1/admin/companies/${companyId}`);
}

export async function resetPassword(userId) {
  const { data } = await client.post(`/api/v1/admin/users/${userId}/reset-password`);
  return data;
}

export async function updateUserRole(userId, role) {
  const { data } = await client.patch(`/api/v1/admin/users/${userId}/role`, { role });
  return data;
}
```

- [ ] **Step 2 : Créer la page SuperAdmin**

```jsx
// frontend/src/pages/SuperAdmin.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanies, getCompanyUsers, deleteCompany, resetPassword, updateUserRole } from "../api/admin";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", readonly: "Lecture", superadmin: "Super Admin" };
const ROLE_COLORS = { admin: "bg-blue-100 text-blue-800", manager: "bg-green-100 text-green-800", readonly: "bg-gray-100 text-gray-600", superadmin: "bg-purple-100 text-purple-800" };

export default function SuperAdmin() {
  const qc = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: getCompanies,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin-company-users", selectedCompany?.id],
    queryFn: () => getCompanyUsers(selectedCompany.id),
    enabled: !!selectedCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      qc.invalidateQueries(["admin-companies"]);
      setSelectedCompany(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => setResetResult(data.temporary_password),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries(["admin-company-users", selectedCompany?.id]),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel Super Admin</h1>

      {resetResult && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-medium text-yellow-800">Mot de passe temporaire :</p>
          <code className="text-lg font-mono">{resetResult}</code>
          <button onClick={() => setResetResult(null)} className="ml-4 text-sm text-yellow-600 underline">Fermer</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste entreprises */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Entreprises ({companies.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedCompany?.id === c.id ? "bg-blue-50" : ""}`}
                onClick={() => setSelectedCompany(c)}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.email} · {c.member_count} membre{c.member_count > 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer ${c.name} ?`)) deleteMutation.mutate(c.id); }}
                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {companies.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">Aucune entreprise</p>}
          </div>
        </div>

        {/* Membres de l'entreprise sélectionnée */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">
              {selectedCompany ? `Membres — ${selectedCompany.name}` : "Sélectionner une entreprise"}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.email}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${ROLE_COLORS[m.role] || "bg-gray-100"}`}>
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { const p = resetMutation.mutate(m.id); }}
                    className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                  >
                    Reset mdp
                  </button>
                  <select
                    value={m.role}
                    onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value })}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="readonly">Lecture</option>
                  </select>
                </div>
              </div>
            ))}
            {selectedCompany && members.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Aucun membre</p>
            )}
            {!selectedCompany && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">← Cliquer sur une entreprise</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/api/admin.js frontend/src/pages/SuperAdmin.jsx
git commit -m "feat: add SuperAdmin page with company and user management"
```

---

## Task 13 : Frontend — page InviteAccept + API members

**Files:**
- Create: `frontend/src/pages/InviteAccept.jsx`
- Create: `frontend/src/api/members.js`

- [ ] **Step 1 : Créer l'API members**

```js
// frontend/src/api/members.js
import client from "./client";

export async function getMembers() {
  const { data } = await client.get("/api/v1/members");
  return data;
}

export async function inviteMember(email, role) {
  const { data } = await client.post("/api/v1/members/invite", { email, role });
  return data;
}

export async function updateMemberRole(userId, role) {
  const { data } = await client.patch(`/api/v1/members/${userId}/role`, { role });
  return data;
}

export async function removeMember(userId) {
  await client.delete(`/api/v1/members/${userId}`);
}

export async function checkInvitation(token) {
  const { data } = await client.get(`/api/v1/invitations/${token}`);
  return data;
}

export async function acceptInvitation(token, password) {
  const { data } = await client.post(`/api/v1/invitations/${token}/accept`, { password });
  return data;
}
```

- [ ] **Step 2 : Créer la page InviteAccept**

```jsx
// frontend/src/pages/InviteAccept.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkInvitation, acceptInvitation } from "../api/members";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkInvitation(token)
      .then(setInvitation)
      .catch(() => setError("Ce lien d'invitation est invalide ou expiré."));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await acceptInvitation(token, password);
      const meRes = await client.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      signIn(data.access_token, { name: data.company_name }, meRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl p-8 shadow-sm border max-w-sm w-full text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    </div>
  );

  if (!invitation) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Vérification du lien...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl p-8 shadow-sm border max-w-sm w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Créer votre compte</h1>
        <p className="text-sm text-gray-500 mb-6">
          Vous avez été invité(e) à rejoindre <strong>{invitation.company_name}</strong> en tant que <strong>{invitation.role}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={invitation.email} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/api/members.js frontend/src/pages/InviteAccept.jsx
git commit -m "feat: add InviteAccept page and members API"
```

---

## Task 14 : Frontend — onglet Équipe dans Settings + restrictions UI

**Files:**
- Modify: `frontend/src/pages/Settings.jsx`

- [ ] **Step 1 : Lire Settings.jsx pour voir la structure des onglets**

Lire `frontend/src/pages/Settings.jsx` entièrement avant de modifier.

- [ ] **Step 2 : Ajouter l'onglet Équipe**

Dans Settings.jsx, ajouter un onglet "Équipe" visible uniquement si `user.role === "admin" || user.role === "superadmin"`. L'onglet affiche :
- La liste des membres avec badges de rôle et bouton supprimer
- Le bouton "Inviter un membre" qui ouvre un modal (email + sélecteur rôle + bouton générer lien)
- Le lien d'invitation généré affiché avec bouton "Copier"

```jsx
// Extrait à intégrer dans Settings.jsx — section onglet Équipe
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMembers, inviteMember, removeMember, updateMemberRole } from "../api/members";
import { useAuth } from "../context/AuthContext";

// Dans le composant, récupérer user :
const { user } = useAuth();

// State pour le modal invitation
const [showInviteModal, setShowInviteModal] = useState(false);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState("manager");
const [inviteLink, setInviteLink] = useState(null);

const { data: members = [] } = useQuery({
  queryKey: ["members"],
  queryFn: getMembers,
  enabled: user?.role === "admin" || user?.role === "superadmin",
});

const inviteMutation = useMutation({
  mutationFn: () => inviteMember(inviteEmail, inviteRole),
  onSuccess: (data) => {
    const link = `${window.location.origin}/invite/${data.token}`;
    setInviteLink(link);
  },
});

const removeMutation = useMutation({
  mutationFn: removeMember,
  onSuccess: () => qc.invalidateQueries(["members"]),
});

const ROLE_LABELS = { admin: "Admin", manager: "Manager", readonly: "Lecture seule" };
const ROLE_COLORS = { admin: "bg-blue-100 text-blue-800", manager: "bg-green-100 text-green-800", readonly: "bg-gray-100 text-gray-600" };
```

- [ ] **Step 3 : Masquer les boutons d'action pour readonly**

Dans chaque page (Rides, Drivers, Vehicles), entourer les boutons d'ajout/modification/suppression d'une condition :

```jsx
const { user } = useAuth();
// Ajouter autour des boutons d'écriture :
{user?.role !== "readonly" && (
  <button onClick={...}>Ajouter</button>
)}
```

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/pages/Settings.jsx frontend/src/pages/Rides.jsx frontend/src/pages/Drivers.jsx frontend/src/pages/Vehicles.jsx
git commit -m "feat: add Team tab in settings and hide write actions for readonly"
```

---

## Task 15 : Frontend — routes + lien superadmin dans sidebar

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Sidebar.jsx` (ou équivalent — lire d'abord)

- [ ] **Step 1 : Lire la structure de la sidebar**

Lire `frontend/src/components/` pour trouver le fichier de navigation/sidebar.

- [ ] **Step 2 : Ajouter les routes dans App.jsx**

```jsx
import SuperAdmin from "./pages/SuperAdmin";
import InviteAccept from "./pages/InviteAccept";

// Dans le composant SuperAdminRoute :
function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "superadmin" ? children : <Navigate to="/dashboard" replace />;
}

// Dans les Routes :
<Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
<Route path="/invite/:token" element={<InviteAccept />} />
```

- [ ] **Step 3 : Ajouter le lien superadmin dans la sidebar**

Dans le composant de navigation, ajouter en bas, conditionnel sur `user?.role === "superadmin"` :

```jsx
{user?.role === "superadmin" && (
  <NavLink to="/superadmin" className="flex items-center gap-2 px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 rounded-lg mt-4 border border-purple-100">
    <span>⚙</span> Admin panel
  </NavLink>
)}
```

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/
git commit -m "feat: add superadmin route and sidebar link, invite acceptance route"
```

---

## Task 16 : Git push + déploiement Railway

- [ ] **Step 1 : Vérifier l'état git**

```bash
git log --oneline -8
git status
```

- [ ] **Step 2 : Push sur GitHub**

```bash
git push origin main
```

- [ ] **Step 3 : Sur Railway — redéployer le backend**

Dans le dashboard Railway, sur le service backend → cliquer **Redeploy** (Railway détecte le push automatiquement si connecté au repo GitHub).

- [ ] **Step 4 : Appliquer la migration sur Railway**

Dans Railway → service backend → onglet **Terminal** :

```bash
python -m alembic upgrade head
```

- [ ] **Step 5 : Créer le compte superadmin sur Railway**

Dans Railway → service backend → onglet **Terminal** :

```bash
SUPERADMIN_EMAIL=ton@email.com SUPERADMIN_PASSWORD=motdepassefort python seed_demo.py
```

- [ ] **Step 6 : Vérifier**

Ouvrir l'URL frontend Railway → se connecter avec le compte superadmin → vérifier le lien "Admin panel" en bas de sidebar.
