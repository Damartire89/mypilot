from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.driver import Driver
from app.models.ride import Ride
from app.models.company import Company
from app.models.settings import CompanySettings
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.auth import get_current_company, require_write_access
from app.audit import log_action
from app.utils.alerts import alert_for_date
from app.models.user import User
from typing import List, Optional
from datetime import datetime, timezone, date

router = APIRouter(prefix="/drivers", tags=["drivers"])


def _get_alert_days(company_id: int, db: Session) -> int:
    s = db.query(CompanySettings).filter_by(company_id=company_id).first()
    if s and s.alert_days_before:
        return s.alert_days_before
    return 30


def _driver_alerts(driver: Driver, alert_days: int = 30) -> dict:
    today = date.today()
    return {
        "carte_pro_alert": alert_for_date(driver.carte_pro_expiry, today, alert_days),
        "carte_vtc_alert": alert_for_date(driver.carte_vtc_expiry, today, alert_days),
    }


def _to_driver_out(driver: Driver, alert_days: int = 30) -> DriverOut:
    alerts = _driver_alerts(driver, alert_days)
    return DriverOut(
        id=driver.id,
        name=driver.name,
        phone=driver.phone,
        license_number=driver.license_number,
        status=driver.status,
        carte_pro_expiry=driver.carte_pro_expiry,
        carte_vtc_expiry=driver.carte_vtc_expiry,
        carte_pro_alert=alerts["carte_pro_alert"],
        carte_vtc_alert=alerts["carte_vtc_alert"],
        created_at=driver.created_at,
    )


@router.get("", response_model=List[DriverOut])
def list_drivers(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    alert_days = _get_alert_days(company.id, db)
    drivers = db.query(Driver).filter(Driver.company_id == company.id).all()
    return [_to_driver_out(d, alert_days) for d in drivers]


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(body: DriverCreate, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_write_access)):
    driver = Driver(**body.model_dump(), company_id=company.id)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    alert_days = _get_alert_days(company.id, db)
    return _to_driver_out(driver, alert_days)


@router.patch("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, body: DriverUpdate, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_write_access)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == company.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chauffeur introuvable")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    alert_days = _get_alert_days(company.id, db)
    return _to_driver_out(driver, alert_days)


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: int, request: Request, company: Company = Depends(get_current_company), db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == company.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chauffeur introuvable")
    rides_detached = db.query(Ride).filter(Ride.driver_id == driver_id, Ride.company_id == company.id).update({"driver_id": None})
    log_action(
        db, current_user, "delete", "driver",
        entity_id=driver.id,
        details={"name": driver.name, "license_number": driver.license_number, "rides_detached": rides_detached},
        request=request,
    )
    db.delete(driver)
    db.commit()


@router.get("/{driver_id}/stats")
def driver_stats(
    driver_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == company.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chauffeur introuvable")

    alert_days = _get_alert_days(company.id, db)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    year = year or now.year
    month = month or now.month

    # Stats du mois sélectionné
    ca_month = db.query(func.sum(Ride.amount)).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).scalar() or 0

    rides_month = db.query(func.count(Ride.id)).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).scalar() or 0

    # Stats globales (tous les temps)
    ca_total = db.query(func.sum(Ride.amount)).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        Ride.status == "paid",
    ).scalar() or 0

    rides_total = db.query(func.count(Ride.id)).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
    ).scalar() or 0

    # Mois précédent pour comparaison
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    ca_prev = db.query(func.sum(Ride.amount)).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == prev_year,
        extract("month", Ride.ride_at) == prev_month,
    ).scalar() or 0

    # Courses du mois (liste)
    rides = db.query(Ride).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).order_by(Ride.ride_at.desc()).limit(50).all()

    # Répartition par type de paiement
    by_type = db.query(
        Ride.payment_type,
        func.sum(Ride.amount).label("ca"),
        func.count(Ride.id).label("count"),
    ).filter(
        Ride.driver_id == driver_id,
        Ride.company_id == company.id,
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).group_by(Ride.payment_type).all()

    return {
        "driver": _to_driver_out(driver, alert_days).model_dump(),
        "year": year,
        "month": month,
        "ca_month": float(ca_month),
        "ca_prev_month": float(ca_prev),
        "rides_month": rides_month,
        "ca_total": float(ca_total),
        "rides_total": rides_total,
        "avg_ride": float(ca_month / rides_month) if rides_month else 0,
        "by_type": [{"type": r.payment_type, "ca": float(r.ca or 0), "count": r.count} for r in by_type],
        "rides": [
            {
                "id": r.id,
                "ride_at": r.ride_at.isoformat() if r.ride_at else None,
                "client_name": r.client_name,
                "origin": r.origin,
                "destination": r.destination,
                "amount": float(r.amount),
                "payment_type": r.payment_type,
                "status": r.status,
            }
            for r in rides
        ],
    }
