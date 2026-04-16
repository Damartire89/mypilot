from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.company import Company
from app.models.settings import CompanySettings
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.auth import get_current_company, require_write_access
from app.models.user import User
from typing import List
from datetime import date

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _get_alert_days(company_id: int, db: Session) -> int:
    s = db.query(CompanySettings).filter_by(company_id=company_id).first()
    if s and s.alert_days_before:
        return s.alert_days_before
    return 30


def _alert_for_date(expiry_date, today, alert_days: int = 30) -> str | None:
    if not expiry_date:
        return None
    delta = (expiry_date - today).days
    if delta < 0:
        return "expired"
    if delta <= alert_days:
        return f"expires_in_{delta}"
    return None


def _compute_alerts(vehicle: Vehicle, alert_days: int = 30) -> dict:
    today = date.today()
    return {
        "ct_alert": _alert_for_date(vehicle.ct_expiry, today, alert_days),
        "insurance_alert": _alert_for_date(vehicle.insurance_expiry, today, alert_days),
        "ads_alert": _alert_for_date(vehicle.ads_expiry, today, alert_days),
        "taximetre_alert": _alert_for_date(vehicle.taximetre_expiry, today, alert_days),
    }


def _to_out(vehicle: Vehicle, alert_days: int = 30) -> VehicleOut:
    alerts = _compute_alerts(vehicle, alert_days)
    return VehicleOut(
        id=vehicle.id,
        plate=vehicle.plate,
        brand=vehicle.brand,
        model=vehicle.model,
        year=vehicle.year,
        status=vehicle.status,
        ct_expiry=vehicle.ct_expiry,
        insurance_expiry=vehicle.insurance_expiry,
        ads_expiry=vehicle.ads_expiry,
        taximetre_expiry=vehicle.taximetre_expiry,
        created_at=vehicle.created_at,
        ct_alert=alerts["ct_alert"],
        insurance_alert=alerts["insurance_alert"],
        ads_alert=alerts["ads_alert"],
        taximetre_alert=alerts["taximetre_alert"],
    )


@router.get("", response_model=List[VehicleOut])
def list_vehicles(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    alert_days = _get_alert_days(company.id, db)
    vehicles = db.query(Vehicle).filter(Vehicle.company_id == company.id).all()
    return [_to_out(v, alert_days) for v in vehicles]


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(body: VehicleCreate, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_write_access)):
    vehicle = Vehicle(**body.model_dump(), company_id=company.id)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    alert_days = _get_alert_days(company.id, db)
    return _to_out(vehicle, alert_days)


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, body: VehicleUpdate, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_write_access)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.company_id == company.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule introuvable")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    alert_days = _get_alert_days(company.id, db)
    return _to_out(vehicle, alert_days)


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: int, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_write_access)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.company_id == company.id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule introuvable")
    db.delete(vehicle)
    db.commit()
