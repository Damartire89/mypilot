from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.settings import CompanySettings
from app.models.company import Company
from app.auth import get_current_company, get_current_user
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    # Entreprise
    company_name: Optional[str] = None
    siret: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    activity_type: Optional[str] = None

    # Facturation
    invoice_prefix: Optional[str] = None
    invoice_next_number: Optional[int] = None
    tva_rate: Optional[str] = None
    invoice_footer: Optional[str] = None
    enabled_payments: Optional[list[str]] = None

    # Alertes
    enabled_alerts: Optional[list[str]] = None
    alert_days_before: Optional[int] = None

    # Affichage
    hide_ca: Optional[bool] = None
    currency: Optional[str] = None
    date_format: Optional[str] = None
    week_start: Optional[str] = None

    # Notifications
    notif_new_ride: Optional[bool] = None
    notif_unpaid: Optional[bool] = None
    notif_alerts: Optional[bool] = None
    notif_daily_report: Optional[bool] = None


def get_or_create_settings(company_id: int, db: Session) -> CompanySettings:
    s = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if not s:
        s = CompanySettings(company_id=company_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("")
def get_settings(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    s = get_or_create_settings(company.id, db)
    return {
        "company_name": company.name,
        "siret": company.siret,
        "phone": company.phone,
        "address": company.address,
        "activity_type": company.activity_type,
        "invoice_prefix": s.invoice_prefix,
        "invoice_next_number": s.invoice_next_number,
        "tva_rate": s.tva_rate,
        "invoice_footer": s.invoice_footer,
        "enabled_payments": s.enabled_payments.split(",") if s.enabled_payments else [],
        "enabled_alerts": s.enabled_alerts.split(",") if s.enabled_alerts else [],
        "alert_days_before": s.alert_days_before,
        "hide_ca": s.hide_ca,
        "currency": s.currency,
        "date_format": s.date_format,
        "week_start": s.week_start,
        "notif_new_ride": s.notif_new_ride,
        "notif_unpaid": s.notif_unpaid,
        "notif_alerts": s.notif_alerts,
        "notif_daily_report": s.notif_daily_report,
    }


@router.patch("")
def update_settings(body: SettingsUpdate, company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    # Mettre à jour company
    if body.company_name is not None:
        company.name = body.company_name
    if body.siret is not None:
        company.siret = body.siret
    if body.phone is not None:
        company.phone = body.phone
    if body.address is not None:
        company.address = body.address
    if body.activity_type is not None:
        company.activity_type = body.activity_type

    # Mettre à jour settings
    s = get_or_create_settings(company.id, db)
    simple_fields = [
        "invoice_prefix", "invoice_next_number", "tva_rate", "invoice_footer",
        "alert_days_before", "hide_ca", "currency", "date_format", "week_start",
        "notif_new_ride", "notif_unpaid", "notif_alerts", "notif_daily_report",
    ]
    for field in simple_fields:
        val = getattr(body, field)
        if val is not None:
            setattr(s, field, val)

    if body.enabled_payments is not None:
        s.enabled_payments = ",".join(body.enabled_payments)
    if body.enabled_alerts is not None:
        s.enabled_alerts = ",".join(body.enabled_alerts)

    db.commit()
    return {"ok": True}
