from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.settings import CompanySettings
from app.models.company import Company
from app.models.ride import Ride
from app.auth import get_current_company, get_current_user, require_role
from app.models.user import User


def _has_issued_invoices(company_id: int, db: Session) -> bool:
    """True si au moins une facture a été émise (issued_at renseigné) pour cette entreprise."""
    return db.query(Ride.id).filter(
        Ride.company_id == company_id,
        Ride.issued_at.isnot(None),
    ).first() is not None


def _validate_iban(iban: str) -> bool:
    """Validation IBAN format + checksum mod 97 (ISO 13616)."""
    s = iban.replace(" ", "").replace("-", "").upper()
    if len(s) < 15 or len(s) > 34:
        return False
    if not s[:2].isalpha() or not s[2:4].isdigit():
        return False
    if not s.isalnum():
        return False
    rearranged = s[4:] + s[:4]
    numeric = "".join(str(ord(c) - 55) if c.isalpha() else c for c in rearranged)
    try:
        return int(numeric) % 97 == 1
    except ValueError:
        return False

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
    show_gasoil_widget: Optional[bool] = None
    currency: Optional[str] = None
    date_format: Optional[str] = None
    week_start: Optional[str] = None

    # Notifications
    notif_new_ride: Optional[bool] = None
    notif_unpaid: Optional[bool] = None
    notif_alerts: Optional[bool] = None
    notif_daily_report: Optional[bool] = None

    # Tarification
    default_km_rate: Optional[str] = None
    night_rate_multiplier: Optional[str] = None
    weekend_rate_multiplier: Optional[str] = None
    max_ride_amount_alert: Optional[str] = None

    # Entreprise étendu
    billing_email: Optional[str] = None
    zone_activite: Optional[str] = None
    numero_licence: Optional[str] = None
    iban: Optional[str] = None


def get_or_create_settings(company_id: int, db: Session) -> CompanySettings:
    s = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if not s:
        s = CompanySettings(company_id=company_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("")
def get_settings(company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_role("admin", "superadmin"))):
    s = get_or_create_settings(company.id, db)
    invoice_numbering_frozen = _has_issued_invoices(company.id, db)
    return {
        "company_name": company.name,
        "siret": company.siret,
        "phone": company.phone,
        "address": company.address,
        "activity_type": company.activity_type,
        "invoice_prefix": s.invoice_prefix,
        "invoice_next_number": s.invoice_next_number,
        "invoice_numbering_frozen": invoice_numbering_frozen,
        "tva_rate": s.tva_rate,
        "invoice_footer": s.invoice_footer,
        "enabled_payments": s.enabled_payments.split(",") if s.enabled_payments else [],
        "enabled_alerts": s.enabled_alerts.split(",") if s.enabled_alerts else [],
        "alert_days_before": s.alert_days_before,
        "hide_ca": s.hide_ca,
        "show_gasoil_widget": s.show_gasoil_widget if s.show_gasoil_widget is not None else True,
        "currency": s.currency,
        "date_format": s.date_format,
        "week_start": s.week_start,
        "notif_new_ride": s.notif_new_ride,
        "notif_unpaid": s.notif_unpaid,
        "notif_alerts": s.notif_alerts,
        "notif_daily_report": s.notif_daily_report,
        # Tarification
        "default_km_rate": s.default_km_rate or "",
        "night_rate_multiplier": s.night_rate_multiplier or "",
        "weekend_rate_multiplier": s.weekend_rate_multiplier or "",
        "max_ride_amount_alert": s.max_ride_amount_alert or "",
        # Entreprise étendu
        "billing_email": s.billing_email or "",
        "zone_activite": s.zone_activite or "",
        "numero_licence": s.numero_licence or "",
        "iban": s.iban or "",
    }


@router.patch("")
def update_settings(body: SettingsUpdate, company: Company = Depends(get_current_company), db: Session = Depends(get_db), _: User = Depends(require_role("admin", "superadmin"))):
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

    # Valider IBAN si fourni
    if body.iban is not None and body.iban.strip():
        if not _validate_iban(body.iban):
            raise HTTPException(status_code=400, detail="IBAN invalide (format ou checksum incorrect)")

    # Freeze numérotation facture : si des factures sont déjà émises,
    # interdire modif de invoice_prefix et invoice_next_number.
    if body.invoice_prefix is not None or body.invoice_next_number is not None:
        if _has_issued_invoices(company.id, db):
            raise HTTPException(
                status_code=409,
                detail="Numérotation figée : des factures ont déjà été émises. Modification de invoice_prefix/invoice_next_number interdite.",
            )

    # Mettre à jour settings
    s = get_or_create_settings(company.id, db)
    simple_fields = [
        "invoice_prefix", "invoice_next_number", "tva_rate", "invoice_footer",
        "alert_days_before", "hide_ca", "show_gasoil_widget",
        "currency", "date_format", "week_start",
        "notif_new_ride", "notif_unpaid", "notif_alerts", "notif_daily_report",
        "default_km_rate", "night_rate_multiplier", "weekend_rate_multiplier", "max_ride_amount_alert",
        "billing_email", "zone_activite", "numero_licence", "iban",
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
