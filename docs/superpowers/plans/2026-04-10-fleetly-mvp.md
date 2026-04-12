# Fleetly MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first SaaS web app for taxi fleet managers to track rides, monitor revenue, manage drivers, and follow up on invoices.

**Architecture:** FastAPI backend (Python) with PostgreSQL, React (Vite) PWA frontend. Multi-tenant: each company has isolated data. JWT auth with single role (admin gérant) for MVP. Static frontend served separately from API.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, Alembic, React 18, Vite, TailwindCSS, React Query, React Router v6

---

## File Structure

```
fleetly/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models.py                # ORM models (Company, Driver, Vehicle, Ride, Invoice)
│   ├── schemas.py               # Pydantic schemas (request/response)
│   ├── auth.py                  # JWT creation + verification
│   ├── deps.py                  # FastAPI dependencies (get_db, get_current_user)
│   ├── routers/
│   │   ├── auth.py              # POST /auth/register, POST /auth/login
│   │   ├── rides.py             # CRUD rides
│   │   ├── drivers.py           # CRUD drivers
│   │   ├── invoices.py          # CRUD invoices
│   │   └── stats.py             # GET /stats (CA, counts)
│   ├── alembic/                 # DB migrations
│   └── tests/
│       ├── conftest.py          # Fixtures: test client, test DB
│       ├── test_auth.py
│       ├── test_rides.py
│       ├── test_drivers.py
│       └── test_stats.py
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx              # Router setup
    │   ├── api.js               # Axios instance + all API calls
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Rides.jsx
    │   │   ├── NewRide.jsx
    │   │   ├── Drivers.jsx
    │   │   └── Stats.jsx
    │   └── components/
    │       ├── BottomNav.jsx
    │       ├── TopBar.jsx
    │       ├── KpiCard.jsx
    │       ├── RideCard.jsx
    │       ├── DriverCard.jsx
    │       └── Badge.jsx
```

---

## Task 1: Project scaffold + DB setup

**Files:**
- Create: `backend/main.py`
- Create: `backend/database.py`
- Create: `backend/models.py`
- Create: `backend/requirements.txt`
- Create: `backend/alembic.ini` (via alembic init)

- [ ] **Step 1: Create backend folder and install deps**

```bash
cd "C:/Users/Damien/Claude Code/PROJECTS/fleetly"
mkdir backend && cd backend
python -m venv venv
venv/Scripts/activate  # Windows
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic pydantic python-jose[cryptography] passlib[bcrypt] pytest httpx
pip freeze > requirements.txt
```

- [ ] **Step 2: Create `backend/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fleetly:fleetly@localhost/fleetly_dev")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass
```

- [ ] **Step 3: Create `backend/models.py`**

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from database import Base
import enum

class RideType(str, enum.Enum):
    medical = "medical"
    private = "private"
    corporate = "corporate"
    airport = "airport"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"

class DriverStatus(str, enum.Enum):
    available = "available"
    on_ride = "on_ride"
    break_ = "break"

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    drivers = relationship("Driver", back_populates="company")
    rides = relationship("Ride", back_populates="company")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    vehicle_plate = Column(String)
    vehicle_model = Column(String)
    status = Column(Enum(DriverStatus), default=DriverStatus.available)
    company = relationship("Company", back_populates="drivers")
    rides = relationship("Ride", back_populates="driver")

class Ride(Base):
    __tablename__ = "rides"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    patient_name = Column(String, nullable=False)
    social_security = Column(String)
    origin = Column(String)
    destination = Column(String)
    ride_type = Column(Enum(RideType), default=RideType.private)
    amount = Column(Float, nullable=False)
    km = Column(Float)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    ride_date = Column(DateTime, default=datetime.utcnow)
    company = relationship("Company", back_populates="rides")
    driver = relationship("Driver", back_populates="rides")
```

- [ ] **Step 4: Init Alembic and create first migration**

```bash
cd backend
alembic init alembic
```

Edit `alembic/env.py` — replace the target_metadata line:
```python
from models import Base
target_metadata = Base.metadata
```

Also set `sqlalchemy.url` in `alembic.ini`:
```
sqlalchemy.url = postgresql://fleetly:fleetly@localhost/fleetly_dev
```

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Expected: tables created in PostgreSQL.

- [ ] **Step 5: Create `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Fleetly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Verify server starts**

```bash
uvicorn main:app --reload
```
Expected: `Application startup complete`. Visit http://localhost:8000/health → `{"status": "ok"}`

- [ ] **Step 7: Commit**

```bash
git init
git add backend/
git commit -m "feat: project scaffold, DB models, Alembic migration"
```

---

## Task 2: Auth — register + login

**Files:**
- Create: `backend/auth.py`
- Create: `backend/deps.py`
- Create: `backend/schemas.py`
- Create: `backend/routers/auth.py`
- Modify: `backend/main.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Create `backend/auth.py`**

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "changeme-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(company_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(company_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> int:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return int(payload["sub"])
```

- [ ] **Step 2: Create `backend/schemas.py`**

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from models import RideType, PaymentStatus, DriverStatus

class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    company_name: str

class DriverCreate(BaseModel):
    name: str
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None

class DriverUpdate(BaseModel):
    status: Optional[DriverStatus] = None

class DriverOut(BaseModel):
    id: int
    name: str
    vehicle_plate: Optional[str]
    vehicle_model: Optional[str]
    status: DriverStatus
    model_config = {"from_attributes": True}

class RideCreate(BaseModel):
    patient_name: str
    social_security: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    ride_type: RideType = RideType.private
    amount: float
    km: Optional[float] = None
    driver_id: Optional[int] = None
    ride_date: Optional[datetime] = None

class RideOut(BaseModel):
    id: int
    patient_name: str
    social_security: Optional[str]
    origin: Optional[str]
    destination: Optional[str]
    ride_type: RideType
    amount: float
    km: Optional[float]
    payment_status: PaymentStatus
    ride_date: datetime
    driver: Optional[DriverOut]
    model_config = {"from_attributes": True}

class RideUpdatePayment(BaseModel):
    payment_status: PaymentStatus

class StatsOut(BaseModel):
    revenue_month: float
    rides_today: int
    active_drivers: int
    total_drivers: int
    unpaid_amount: float
    unpaid_count: int
```

- [ ] **Step 3: Create `backend/deps.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import decode_token
from models import Company
from jose import JWTError

bearer = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_company(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> Company:
    try:
        company_id = decode_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Company not found")
    return company
```

- [ ] **Step 4: Create `backend/routers/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from deps import get_db
from models import Company
from schemas import RegisterRequest, LoginRequest, TokenResponse
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Company).filter(Company.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    company = Company(
        name=data.company_name,
        email=data.email,
        hashed_password=hash_password(data.password)
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return TokenResponse(
        access_token=create_access_token(company.id),
        company_name=company.name
    )

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.email == data.email).first()
    if not company or not verify_password(data.password, company.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(company.id),
        company_name=company.name
    )
```

- [ ] **Step 5: Register router in `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth as auth_router

app = FastAPI(title="Fleetly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Create `backend/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from deps import get_db
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

TEST_DB = "sqlite:///./test.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

- [ ] **Step 7: Write tests in `backend/tests/test_auth.py`**

```python
def test_register_success(client):
    r = client.post("/auth/register", json={
        "company_name": "Taxi Martin",
        "email": "martin@taxi.fr",
        "password": "secret123"
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["company_name"] == "Taxi Martin"

def test_register_duplicate_email(client):
    payload = {"company_name": "T1", "email": "a@b.fr", "password": "secret"}
    client.post("/auth/register", json=payload)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 400

def test_login_success(client):
    client.post("/auth/register", json={"company_name": "T", "email": "t@t.fr", "password": "pw"})
    r = client.post("/auth/login", json={"email": "t@t.fr", "password": "pw"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_wrong_password(client):
    client.post("/auth/register", json={"company_name": "T", "email": "t@t.fr", "password": "pw"})
    r = client.post("/auth/login", json={"email": "t@t.fr", "password": "wrong"})
    assert r.status_code == 401
```

- [ ] **Step 8: Run tests**

```bash
cd backend
pytest tests/test_auth.py -v
```
Expected: 4 tests PASSED.

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: auth register + login with JWT"
```

---

## Task 3: Drivers API

**Files:**
- Create: `backend/routers/drivers.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_drivers.py`

- [ ] **Step 1: Write failing test in `backend/tests/test_drivers.py`**

```python
def auth_header(client):
    r = client.post("/auth/register", json={
        "company_name": "Taxi Test", "email": "test@taxi.fr", "password": "pw"
    })
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

def test_create_driver(client):
    h = auth_header(client)
    r = client.post("/drivers", json={"name": "Jean-Luc", "vehicle_plate": "AB-456-CD"}, headers=h)
    assert r.status_code == 201
    assert r.json()["name"] == "Jean-Luc"

def test_list_drivers(client):
    h = auth_header(client)
    client.post("/drivers", json={"name": "Jean-Luc"}, headers=h)
    r = client.get("/drivers", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 1

def test_update_driver_status(client):
    h = auth_header(client)
    r = client.post("/drivers", json={"name": "Jean-Luc"}, headers=h)
    driver_id = r.json()["id"]
    r = client.patch(f"/drivers/{driver_id}", json={"status": "on_ride"}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "on_ride"

def test_driver_isolated_per_company(client):
    h1_r = client.post("/auth/register", json={"company_name": "T1", "email": "t1@t.fr", "password": "pw"})
    h2_r = client.post("/auth/register", json={"company_name": "T2", "email": "t2@t.fr", "password": "pw"})
    h1 = {"Authorization": f"Bearer {h1_r.json()['access_token']}"}
    h2 = {"Authorization": f"Bearer {h2_r.json()['access_token']}"}
    client.post("/drivers", json={"name": "Chauffeur T1"}, headers=h1)
    r = client.get("/drivers", headers=h2)
    assert r.json() == []
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pytest tests/test_drivers.py -v
```
Expected: FAIL (404 or route not found).

- [ ] **Step 3: Create `backend/routers/drivers.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from deps import get_db, get_current_company
from models import Driver, Company
from schemas import DriverCreate, DriverUpdate, DriverOut

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.get("", response_model=list[DriverOut])
def list_drivers(db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    return db.query(Driver).filter(Driver.company_id == company.id).all()

@router.post("", response_model=DriverOut, status_code=201)
def create_driver(data: DriverCreate, db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    driver = Driver(**data.model_dump(), company_id=company.id)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver

@router.patch("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, data: DriverUpdate, db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == company.id).first()
    if not driver:
        raise HTTPException(404, "Driver not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(driver, k, v)
    db.commit()
    db.refresh(driver)
    return driver
```

- [ ] **Step 4: Register router in `backend/main.py`**

Add after existing imports and `include_router` calls:
```python
from routers import drivers as drivers_router
app.include_router(drivers_router.router)
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_drivers.py -v
```
Expected: 4 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: drivers CRUD with company isolation"
```

---

## Task 4: Rides API

**Files:**
- Create: `backend/routers/rides.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_rides.py`

- [ ] **Step 1: Write failing test in `backend/tests/test_rides.py`**

```python
def setup(client):
    r = client.post("/auth/register", json={"company_name": "T", "email": "t@t.fr", "password": "pw"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    dr = client.post("/drivers", json={"name": "Jean-Luc"}, headers=h)
    return h, dr.json()["id"]

def test_create_ride(client):
    h, driver_id = setup(client)
    r = client.post("/rides", json={
        "patient_name": "Mme Dupont",
        "ride_type": "medical",
        "amount": 47.20,
        "driver_id": driver_id,
        "origin": "Grenoble",
        "destination": "CHU"
    }, headers=h)
    assert r.status_code == 201
    assert r.json()["patient_name"] == "Mme Dupont"
    assert r.json()["payment_status"] == "pending"

def test_list_rides_filter_today(client):
    h, driver_id = setup(client)
    client.post("/rides", json={"patient_name": "A", "amount": 10.0}, headers=h)
    r = client.get("/rides?period=today", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 1

def test_update_payment_status(client):
    h, _ = setup(client)
    r = client.post("/rides", json={"patient_name": "A", "amount": 30.0}, headers=h)
    ride_id = r.json()["id"]
    r = client.patch(f"/rides/{ride_id}/payment", json={"payment_status": "paid"}, headers=h)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pytest tests/test_rides.py -v
```
Expected: FAIL.

- [ ] **Step 3: Create `backend/routers/rides.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from deps import get_db, get_current_company
from models import Ride, Company
from schemas import RideCreate, RideOut, RideUpdatePayment
from typing import Optional

router = APIRouter(prefix="/rides", tags=["rides"])

@router.get("", response_model=list[RideOut])
def list_rides(
    period: Optional[str] = Query(None),  # today | week | month
    ride_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    company: Company = Depends(get_current_company)
):
    q = db.query(Ride).filter(Ride.company_id == company.id)
    if period == "today":
        today = date.today()
        q = q.filter(Ride.ride_date >= datetime.combine(today, datetime.min.time()))
    elif period == "week":
        from datetime import timedelta
        q = q.filter(Ride.ride_date >= datetime.utcnow() - timedelta(days=7))
    elif period == "month":
        q = q.filter(Ride.ride_date >= datetime.utcnow().replace(day=1, hour=0, minute=0, second=0))
    if ride_type:
        q = q.filter(Ride.ride_type == ride_type)
    return q.order_by(Ride.ride_date.desc()).all()

@router.post("", response_model=RideOut, status_code=201)
def create_ride(data: RideCreate, db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    ride = Ride(**data.model_dump(), company_id=company.id)
    if ride.ride_date is None:
        ride.ride_date = datetime.utcnow()
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride

@router.patch("/{ride_id}/payment", response_model=RideOut)
def update_payment(ride_id: int, data: RideUpdatePayment, db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(404, "Ride not found")
    ride.payment_status = data.payment_status
    db.commit()
    db.refresh(ride)
    return ride
```

- [ ] **Step 4: Register router in `backend/main.py`**

```python
from routers import rides as rides_router
app.include_router(rides_router.router)
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_rides.py -v
```
Expected: 3 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: rides CRUD with period filter + payment update"
```

---

## Task 5: Stats API

**Files:**
- Create: `backend/routers/stats.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_stats.py`

- [ ] **Step 1: Write failing test in `backend/tests/test_stats.py`**

```python
from datetime import datetime

def setup_with_rides(client):
    r = client.post("/auth/register", json={"company_name": "T", "email": "t@t.fr", "password": "pw"})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    dr = client.post("/drivers", json={"name": "Jean-Luc"}, headers=h)
    driver_id = dr.json()["id"]
    # Create 2 rides this month
    for amount in [47.20, 32.00]:
        client.post("/rides", json={"patient_name": "Patient", "amount": amount, "ride_type": "medical"}, headers=h)
    return h, driver_id

def test_stats_revenue(client):
    h, _ = setup_with_rides(client)
    r = client.get("/stats", headers=h)
    assert r.status_code == 200
    data = r.json()
    assert data["revenue_month"] == pytest.approx(79.20, 0.01)
    assert data["rides_today"] == 2
    assert data["unpaid_amount"] == pytest.approx(79.20, 0.01)
    assert data["unpaid_count"] == 2

import pytest
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pytest tests/test_stats.py -v
```
Expected: FAIL.

- [ ] **Step 3: Create `backend/routers/stats.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from deps import get_db, get_current_company
from models import Ride, Driver, Company, PaymentStatus, DriverStatus
from schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db), company: Company = Depends(get_current_company)):
    today_start = datetime.combine(date.today(), datetime.min.time())
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)

    revenue_month = db.query(func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.ride_date >= month_start
    ).scalar() or 0.0

    rides_today = db.query(func.count(Ride.id)).filter(
        Ride.company_id == company.id,
        Ride.ride_date >= today_start
    ).scalar() or 0

    total_drivers = db.query(func.count(Driver.id)).filter(Driver.company_id == company.id).scalar() or 0
    active_drivers = db.query(func.count(Driver.id)).filter(
        Driver.company_id == company.id,
        Driver.status == DriverStatus.on_ride
    ).scalar() or 0

    unpaid = db.query(func.sum(Ride.amount), func.count(Ride.id)).filter(
        Ride.company_id == company.id,
        Ride.payment_status == PaymentStatus.pending
    ).first()

    return StatsOut(
        revenue_month=revenue_month,
        rides_today=rides_today,
        active_drivers=active_drivers,
        total_drivers=total_drivers,
        unpaid_amount=unpaid[0] or 0.0,
        unpaid_count=unpaid[1] or 0
    )
```

- [ ] **Step 4: Register router in `backend/main.py`**

```python
from routers import stats as stats_router
app.include_router(stats_router.router)
```

- [ ] **Step 5: Run all backend tests**

```bash
pytest tests/ -v
```
Expected: all tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: stats endpoint (revenue, rides, drivers, unpaid)"
```

---

## Task 6: Frontend scaffold + auth pages

**Files:**
- Create: `frontend/` (Vite + React + Tailwind)
- Create: `frontend/src/api.js`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Scaffold Vite + React**

```bash
cd "C:/Users/Damien/Claude Code/PROJECTS/fleetly"
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Configure Tailwind in `frontend/tailwind.config.js`**

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#4f8ef7",
        dark: "#1a1a2e",
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
```

- [ ] **Step 4: Create `frontend/src/api.js`**

```js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fleetly_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getStats = () => api.get("/stats");
export const getRides = (params) => api.get("/rides", { params });
export const createRide = (data) => api.post("/rides", data);
export const updatePayment = (id, status) => api.patch(`/rides/${id}/payment`, { payment_status: status });
export const getDrivers = () => api.get("/drivers");
export const createDriver = (data) => api.post("/drivers", data);
export const updateDriverStatus = (id, status) => api.patch(`/drivers/${id}`, { status });

export default api;
```

- [ ] **Step 5: Create `frontend/src/pages/Login.jsx`**

```jsx
import { useState } from "react";
import { login, register } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ company_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const fn = mode === "login" ? login : register;
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await fn(payload);
      localStorage.setItem("fleetly_token", data.access_token);
      localStorage.setItem("fleetly_company", data.company_name);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6">
        <div className="text-2xl font-black text-dark mb-1">
          Fleet<span className="text-brand">ly</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">Gestion de flotte simplifiée</p>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-white shadow text-dark" : "text-gray-500"}`}>
              {m === "login" ? "Connexion" : "Créer un compte"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
              placeholder="Nom de l'entreprise" value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
          )}
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
            type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
            type="password" placeholder="Mot de passe" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit"
            className="w-full bg-dark text-white rounded-xl py-3 text-sm font-bold">
            {mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `frontend/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rides from "./pages/Rides";
import NewRide from "./pages/NewRide";
import Drivers from "./pages/Drivers";
import Stats from "./pages/Stats";

const qc = new QueryClient();
const isAuth = () => !!localStorage.getItem("fleetly_token");

function Protected({ children }) {
  return isAuth() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/rides" element={<Protected><Rides /></Protected>} />
          <Route path="/rides/new" element={<Protected><NewRide /></Protected>} />
          <Route path="/drivers" element={<Protected><Drivers /></Protected>} />
          <Route path="/stats" element={<Protected><Stats /></Protected>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Update `frontend/src/main.jsx`**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

- [ ] **Step 8: Verify dev server**

```bash
cd frontend && npm run dev
```
Expected: http://localhost:5173 shows login page.

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffold + login/register page"
```

---

## Task 7: Shared components (TopBar, BottomNav, Badge, KpiCard)

**Files:**
- Create: `frontend/src/components/TopBar.jsx`
- Create: `frontend/src/components/BottomNav.jsx`
- Create: `frontend/src/components/Badge.jsx`
- Create: `frontend/src/components/KpiCard.jsx`

- [ ] **Step 1: Create `frontend/src/components/TopBar.jsx`**

```jsx
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const company = localStorage.getItem("fleetly_company") || "";
  const initials = company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("fleetly_token");
    localStorage.removeItem("fleetly_company");
    navigate("/login");
  };

  return (
    <div className="bg-dark px-4 py-3 flex items-center justify-between">
      <span className="text-white font-black text-lg">Fleet<span className="text-brand">ly</span></span>
      <button onClick={logout}
        className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
        {initials}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/BottomNav.jsx`**

```jsx
import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/rides", label: "Courses", icon: "🕐" },
  { to: "/drivers", label: "Chauffeurs", icon: "👥" },
  { to: "/stats", label: "Stats", icon: "📊" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex max-w-lg mx-auto">
      {items.map(({ to, label, icon }) => (
        <Link key={to} to={to}
          className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs font-semibold transition-colors
            ${pathname === to ? "text-brand" : "text-gray-400"}`}>
          <span className="text-lg leading-none">{icon}</span>
          {label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/Badge.jsx`**

```jsx
const styles = {
  medical: "bg-blue-100 text-blue-700",
  private: "bg-gray-100 text-gray-600",
  corporate: "bg-purple-100 text-purple-700",
  airport: "bg-indigo-100 text-indigo-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
};

const labels = {
  medical: "CPAM",
  private: "Privé",
  corporate: "Entreprise",
  airport: "Aéroport",
  paid: "Payé",
  pending: "En attente",
};

export default function Badge({ type }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${styles[type] || "bg-gray-100 text-gray-600"}`}>
      {labels[type] || type}
    </span>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/KpiCard.jsx`**

```jsx
export default function KpiCard({ label, value, delta, alert }) {
  return (
    <div className={`rounded-xl p-4 ${alert ? "bg-red-50" : "bg-blue-50"}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-black ${alert ? "text-red-500" : "text-dark"}`}>{value}</div>
      {delta && <div className={`text-xs mt-1 ${alert ? "text-red-400" : "text-green-500"}`}>{delta}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: shared components (TopBar, BottomNav, Badge, KpiCard)"
```

---

## Task 8: Dashboard page

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create `frontend/src/pages/Dashboard.jsx`**

```jsx
import { useQuery } from "@tanstack/react-query";
import { getStats, getRides } from "../api";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import KpiCard from "../components/KpiCard";
import Badge from "../components/Badge";

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => getStats().then(r => r.data) });
  const { data: rides } = useQuery({ queryKey: ["rides", "today"], queryFn: () => getRides({ period: "today" }).then(r => r.data) });
  const company = localStorage.getItem("fleetly_company") || "";

  return (
    <div className="max-w-lg mx-auto pb-20">
      <TopBar />
      <div className="p-4">
        <p className="text-gray-500 text-sm">Bonjour, <strong className="text-dark">{company} 👋</strong></p>
        <p className="text-xs text-gray-400 mb-3">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>

        {stats?.unpaid_count > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-sm text-orange-700 flex items-center gap-2 mb-4">
            ⚠️ {stats.unpaid_count} facture{stats.unpaid_count > 1 ? "s" : ""} en attente ({stats.unpaid_amount.toFixed(0)}€)
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <KpiCard label="CA ce mois" value={`${stats?.revenue_month?.toFixed(0) ?? "—"}€`} delta="ce mois" />
          <KpiCard label="Courses aujourd'hui" value={stats?.rides_today ?? "—"} />
          <KpiCard label="Chauffeurs actifs" value={stats ? `${stats.active_drivers} / ${stats.total_drivers}` : "—"} />
          <KpiCard label="Factures impayées" value={`${stats?.unpaid_amount?.toFixed(0) ?? "—"}€`} delta={`${stats?.unpaid_count ?? 0} factures`} alert={stats?.unpaid_count > 0} />
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Courses récentes</p>
        {(rides || []).slice(0, 5).map(ride => (
          <div key={ride.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ride.payment_status === "paid" ? "bg-green-400" : "bg-orange-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{ride.patient_name}</p>
              <p className="text-xs text-gray-400">{ride.driver?.name ?? "—"} · {ride.ride_type === "medical" ? "CPAM" : "Privé"}</p>
            </div>
            <span className="text-sm font-bold">{ride.amount.toFixed(2)}€</span>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

With backend running (`uvicorn main:app --reload`) and frontend running (`npm run dev`):
- Register a new company
- Should redirect to Dashboard showing empty KPIs
- No errors in console

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: dashboard page with KPIs and recent rides"
```

---

## Task 9: Rides list + new ride form

**Files:**
- Create: `frontend/src/pages/Rides.jsx`
- Create: `frontend/src/pages/NewRide.jsx`

- [ ] **Step 1: Create `frontend/src/pages/Rides.jsx`**

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRides, updatePayment } from "../api";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import Badge from "../components/Badge";

const PERIODS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
];

export default function Rides() {
  const [period, setPeriod] = useState("today");
  const [typeFilter, setTypeFilter] = useState(null);
  const qc = useQueryClient();

  const { data: rides = [] } = useQuery({
    queryKey: ["rides", period, typeFilter],
    queryFn: () => getRides({ period, ride_type: typeFilter || undefined }).then(r => r.data)
  });

  const togglePayment = useMutation({
    mutationFn: ({ id, status }) => updatePayment(id, status),
    onSuccess: () => qc.invalidateQueries(["rides"]),
  });

  return (
    <div className="max-w-lg mx-auto pb-20">
      <TopBar />
      <div className="p-4">
        <p className="text-xl font-black text-dark mb-3">Courses</p>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all
                ${period === key ? "bg-dark text-white border-dark" : "text-gray-500 border-gray-200"}`}>
              {label}
            </button>
          ))}
          {["medical", "private"].map(t => (
            <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all
                ${typeFilter === t ? "bg-dark text-white border-dark" : "text-gray-500 border-gray-200"}`}>
              {t === "medical" ? "CPAM" : "Privé"}
            </button>
          ))}
        </div>

        {rides.map(ride => (
          <div key={ride.id} className="border border-gray-100 rounded-xl p-3 mb-2">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm">{ride.patient_name}</span>
              <span className="text-brand font-black">{ride.amount.toFixed(2)}€</span>
            </div>
            {ride.origin && <p className="text-xs text-gray-500 mb-1">📍 {ride.origin} → {ride.destination}</p>}
            <p className="text-xs text-gray-400 mb-2">👤 {ride.driver?.name ?? "—"} · {new Date(ride.ride_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            <div className="flex gap-2 items-center">
              <Badge type={ride.ride_type} />
              <button onClick={() => togglePayment.mutate({
                id: ride.id,
                status: ride.payment_status === "paid" ? "pending" : "paid"
              })}>
                <Badge type={ride.payment_status} />
              </button>
            </div>
          </div>
        ))}

        {rides.length === 0 && <p className="text-center text-gray-400 text-sm mt-8">Aucune course</p>}
      </div>

      <Link to="/rides/new"
        className="fixed bottom-20 right-4 bg-brand text-white px-5 py-3 rounded-full font-bold text-sm shadow-lg">
        + Nouvelle course
      </Link>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/NewRide.jsx`**

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRide, getDrivers } from "../api";
import TopBar from "../components/TopBar";

const TYPES = [
  { key: "medical", label: "🏥 Médical (CPAM)" },
  { key: "private", label: "🚖 Course privée" },
  { key: "corporate", label: "🏢 Entreprise" },
  { key: "airport", label: "✈️ Aéroport" },
];

export default function NewRide() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ patient_name: "", social_security: "", origin: "", destination: "", ride_type: "medical", amount: "", km: "", driver_id: "" });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers().then(r => r.data) });

  const mutation = useMutation({
    mutationFn: createRide,
    onSuccess: () => { qc.invalidateQueries(["rides"]); qc.invalidateQueries(["stats"]); navigate("/rides"); }
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      amount: parseFloat(form.amount),
      km: form.km ? parseFloat(form.km) : undefined,
      driver_id: form.driver_id ? parseInt(form.driver_id) : undefined,
    });
  };

  return (
    <div className="max-w-lg mx-auto pb-6">
      <TopBar />
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-black text-dark">Nouvelle course</p>
          <button onClick={() => navigate(-1)} className="text-brand text-sm font-semibold">Annuler</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ key, label }) => (
                <button type="button" key={key} onClick={() => set("ride_type", key)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all
                    ${form.ride_type === key ? "border-brand bg-blue-50 text-brand" : "border-gray-200 text-gray-500"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: "patient_name", label: "Patient / Client", placeholder: "Nom", required: true },
            ...(form.ride_type === "medical" ? [{ key: "social_security", label: "N° Sécurité Sociale", placeholder: "1 85 06 75 xxx" }] : []),
            { key: "origin", label: "Départ", placeholder: "Adresse de départ" },
            { key: "destination", label: "Arrivée", placeholder: "Destination" },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label}</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
                placeholder={placeholder} value={form[key]} required={required}
                onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Montant (€)</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
                type="number" step="0.01" placeholder="0.00" required value={form.amount}
                onChange={(e) => set("amount", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">KM</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
                type="number" placeholder="ex. 12" value={form.km}
                onChange={(e) => set("km", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Chauffeur</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50"
              value={form.driver_id} onChange={(e) => set("driver_id", e.target.value)}>
              <option value="">— Sélectionner —</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-dark text-white rounded-xl py-4 text-sm font-bold mt-2 disabled:opacity-50">
            {mutation.isPending ? "Enregistrement…" : "✓ Enregistrer la course"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: rides list with filters + new ride form"
```

---

## Task 10: Drivers + Stats pages

**Files:**
- Create: `frontend/src/pages/Drivers.jsx`
- Create: `frontend/src/pages/Stats.jsx`

- [ ] **Step 1: Create `frontend/src/pages/Drivers.jsx`**

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDrivers, createDriver, updateDriverStatus } from "../api";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const STATUS_LABELS = { available: "Libre", on_ride: "En course", break: "Pause" };
const STATUS_COLORS = { available: "bg-green-100 text-green-700", on_ride: "bg-blue-100 text-blue-700", break: "bg-gray-100 text-gray-500" };
const NEXT_STATUS = { available: "on_ride", on_ride: "break", break: "available" };

export default function Drivers() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", vehicle_plate: "", vehicle_model: "" });
  const qc = useQueryClient();
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers().then(r => r.data) });

  const addDriver = useMutation({
    mutationFn: createDriver,
    onSuccess: () => { qc.invalidateQueries(["drivers"]); setShowForm(false); setForm({ name: "", vehicle_plate: "", vehicle_model: "" }); }
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateDriverStatus(id, status),
    onSuccess: () => qc.invalidateQueries(["drivers"]),
  });

  return (
    <div className="max-w-lg mx-auto pb-20">
      <TopBar />
      <div className="p-4">
        <p className="text-xl font-black text-dark mb-4">Chauffeurs</p>

        {drivers.map(d => {
          const initials = d.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={d.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 mb-2">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-brand font-black text-sm flex-shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{d.name}</p>
                <p className="text-xs text-gray-400">{d.vehicle_plate} {d.vehicle_model ? `· ${d.vehicle_model}` : ""}</p>
              </div>
              <button onClick={() => changeStatus.mutate({ id: d.id, status: NEXT_STATUS[d.status] })}
                className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[d.status]}`}>
                {STATUS_LABELS[d.status]}
              </button>
            </div>
          );
        })}

        {showForm ? (
          <div className="border-2 border-dashed border-brand rounded-xl p-4 mt-2">
            {[
              { key: "name", label: "Nom", required: true },
              { key: "vehicle_plate", label: "Immatriculation" },
              { key: "vehicle_model", label: "Modèle véhicule" },
            ].map(({ key, label, required }) => (
              <div key={key} className="mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{label}</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50"
                  required={required} value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => addDriver.mutate(form)}
                className="flex-1 bg-dark text-white rounded-xl py-2.5 text-sm font-bold">Ajouter</button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-500">Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-bold text-brand mt-2">
            + Ajouter un chauffeur
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/Stats.jsx`**

```jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStats, getRides, getDrivers } from "../api";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function Stats() {
  const [period, setPeriod] = useState("month");
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => getStats().then(r => r.data) });
  const { data: rides = [] } = useQuery({ queryKey: ["rides", period], queryFn: () => getRides({ period }).then(r => r.data) });
  const { data: drivers = [] } = useQuery({ queryKey: ["drivers"], queryFn: () => getDrivers().then(r => r.data) });

  const totalRevenue = rides.reduce((sum, r) => sum + r.amount, 0);
  const avgRide = rides.length ? totalRevenue / rides.length : 0;
  const medicalRevenue = rides.filter(r => r.ride_type === "medical").reduce((sum, r) => sum + r.amount, 0);
  const privateRevenue = totalRevenue - medicalRevenue;

  const driverRevenue = drivers.map(d => ({
    ...d,
    revenue: rides.filter(r => r.driver?.id === d.id).reduce((s, r) => s + r.amount, 0)
  })).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...driverRevenue.map(d => d.revenue), 1);

  return (
    <div className="max-w-lg mx-auto pb-20">
      <TopBar />
      <div className="p-4">
        <p className="text-xl font-black text-dark mb-3">Statistiques</p>
        <div className="flex gap-2 mb-4">
          {[["month", "Ce mois"], ["week", "7 jours"]].map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${period === key ? "bg-dark text-white border-dark" : "text-gray-500 border-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "CA total", value: `${totalRevenue.toFixed(0)}€` },
            { label: "Courses", value: rides.length },
            { label: "Moy. course", value: `${avgRide.toFixed(0)}€` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-dark">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Répartition</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">CPAM</p>
            <p className="text-xl font-black text-dark">{totalRevenue ? ((medicalRevenue / totalRevenue) * 100).toFixed(0) : 0}%</p>
            <p className="text-xs text-brand">{medicalRevenue.toFixed(0)}€</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Privé</p>
            <p className="text-xl font-black text-dark">{totalRevenue ? ((privateRevenue / totalRevenue) * 100).toFixed(0) : 0}%</p>
            <p className="text-xs text-brand">{privateRevenue.toFixed(0)}€</p>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Par chauffeur</p>
        {driverRevenue.map(d => (
          <div key={d.id} className="flex items-center gap-3 mb-2">
            <span className="text-sm font-bold w-20 truncate">{d.name}</span>
            <div className="flex-1 bg-blue-100 rounded-full h-2 overflow-hidden">
              <div className="bg-brand h-full rounded-full transition-all"
                style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
            </div>
            <span className="text-sm font-bold w-16 text-right">{d.revenue.toFixed(0)}€</span>
          </div>
        ))}
        {driverRevenue.length === 0 && <p className="text-center text-gray-400 text-sm">Aucun chauffeur</p>}
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Run full app end-to-end**

With backend and frontend both running:
1. Register → redirect to Dashboard
2. Add a driver (Drivers page)
3. Add 2 rides (one medical, one private)
4. Check Dashboard shows correct KPIs
5. Check Stats shows the CA and breakdown
6. Toggle a ride payment status

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat: drivers page + stats page — MVP complete"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dashboard KPIs (CA, courses, chauffeurs, impayées) | Task 5 (stats API) + Task 8 (Dashboard page) |
| Alerte factures impayées | Task 8 |
| Liste courses avec filtres CPAM/Privé/période | Task 4 (rides API) + Task 9 (Rides page) |
| Saisie course (type, patient, N°SS, trajet, montant, chauffeur) | Task 4 + Task 9 (NewRide) |
| Chauffeurs avec statut (Libre/En course/Pause) | Task 3 + Task 10 (Drivers) |
| Stats CA + répartition + par chauffeur | Task 5 + Task 10 (Stats) |
| Multi-tenant isolation | Task 3 test_driver_isolated_per_company |
| Auth JWT register + login | Task 2 |
| Mobile-first design | All frontend tasks (max-w-lg, bottom nav) |

**No gaps identified.**

**Placeholder scan:** None found — all steps have complete code.

**Type consistency:**
- `DriverStatus.on_ride` used consistently in models.py, schemas.py, stats router, and frontend
- `RideType.medical` / `PaymentStatus.pending` consistent across all tasks
- `company_id` foreign key pattern consistent in all models and queries
