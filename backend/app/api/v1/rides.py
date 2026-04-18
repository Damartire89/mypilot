from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.ride import Ride
from app.models.driver import Driver
from app.models.company import Company
from app.models.settings import CompanySettings
from app.schemas.ride import RideCreate, RideUpdate, RideOut, PAYMENT_TYPES, RIDE_STATUSES
from app.auth import get_current_company, get_current_user, require_write_access
from app.models.user import User
from app.pdf import generate_invoice_pdf
from app.audit import log_action
from typing import List, Optional
from datetime import date, datetime, timezone, timedelta
import csv
import io

router = APIRouter(prefix="/rides", tags=["rides"])


# ── LISTE & CREATION ────────────────────────────────────────────────────────

@router.get("", response_model=List[RideOut])
def list_rides(
    status: Optional[str] = None,
    payment_type: Optional[str] = None,
    driver_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    q = db.query(Ride).filter(Ride.company_id == company.id)
    if status:
        if status not in RIDE_STATUSES:
            raise HTTPException(status_code=400, detail="Statut invalide")
        q = q.filter(Ride.status == status)
    if payment_type:
        if payment_type not in PAYMENT_TYPES:
            raise HTTPException(status_code=400, detail="Type de paiement invalide")
        q = q.filter(Ride.payment_type == payment_type)
    if driver_id:
        q = q.filter(Ride.driver_id == driver_id)
    if date_from:
        q = q.filter(func.date(Ride.ride_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Ride.ride_at) <= date_to)
    return q.order_by(Ride.ride_at.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=RideOut, status_code=201)
def create_ride(body: RideCreate, request: Request, company: Company = Depends(get_current_company), db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    data = body.model_dump()
    invoice_issued = False
    if not data.get("reference"):
        settings = (
            db.query(CompanySettings)
            .filter_by(company_id=company.id)
            .with_for_update()
            .first()
        )
        if settings:
            from app.utils.invoice import format_invoice_reference
            year = datetime.now(timezone.utc).year
            num = settings.invoice_next_number or 1
            data["reference"] = format_invoice_reference(settings.invoice_prefix, year, num)
            settings.invoice_next_number = num + 1
            db.add(settings)
            data["issued_at"] = datetime.now(timezone.utc)
            invoice_issued = True
    ride = Ride(**data, company_id=company.id)
    db.add(ride)
    db.flush()
    if invoice_issued:
        log_action(
            db, current_user, "invoice_issued", "ride",
            entity_id=ride.id,
            details={"reference": ride.reference, "amount": float(ride.amount or 0)},
            request=request,
        )
    db.commit()
    db.refresh(ride)
    return ride


# ── ROUTES STATIQUES (DOIVENT ÊTRE AVANT /{ride_id}) ────────────────────────

@router.get("/export/csv")
def export_rides_csv(
    request: Request,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    driver_id: Optional[int] = None,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ride, Driver.name.label("driver_name")).outerjoin(
        Driver, Ride.driver_id == Driver.id
    ).filter(Ride.company_id == company.id)

    if status:
        q = q.filter(Ride.status == status)
    if driver_id:
        q = q.filter(Ride.driver_id == driver_id)
    if date_from:
        q = q.filter(func.date(Ride.ride_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Ride.ride_at) <= date_to)

    rows = q.order_by(Ride.ride_at.desc()).all()

    log_action(
        db, current_user, "export_csv", "ride",
        details={
            "count": len(rows),
            "date_from": date_from.isoformat() if date_from else None,
            "date_to": date_to.isoformat() if date_to else None,
            "status": status,
            "driver_id": driver_id,
        },
        request=request,
    )
    db.commit()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Date", "Heure", "Client", "Départ", "Destination", "Montant (€)", "Paiement", "Statut", "Chauffeur"])

    PAYMENT_LABELS = {
        "cpam": "CPAM", "mutuelle": "Mutuelle", "cash": "Espèces",
        "card": "Carte", "virement": "Virement", "cheque": "Chèque"
    }
    STATUS_LABELS = {"paid": "Payé", "pending": "En attente", "cancelled": "Annulé"}

    for ride, driver_name in rows:
        dt = ride.ride_at
        writer.writerow([
            dt.strftime("%d/%m/%Y") if dt else "",
            dt.strftime("%H:%M") if dt else "",
            ride.client_name or "",
            ride.origin or "",
            ride.destination or "",
            f"{ride.amount:.2f}".replace(".", ","),
            PAYMENT_LABELS.get(ride.payment_type, ride.payment_type or ""),
            STATUS_LABELS.get(ride.status, ride.status or ""),
            driver_name or "",
        ])

    output.seek(0)
    # BOM UTF-8 pour compatibilité Excel
    content = "\ufeff" + output.getvalue()
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in company.name)
    filename = f"courses_{safe_name}.csv"
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/pdf/{ride_id}")
def export_ride_pdf(
    ride_id: int,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")
    driver = None
    if ride.driver_id:
        driver = db.query(Driver).filter(Driver.id == ride.driver_id, Driver.company_id == company.id).first()
        if not driver:
            # Chauffeur supprimé mais course conserve la référence — on détache proprement
            ride.driver_id = None
            db.commit()
    settings = db.query(CompanySettings).filter_by(company_id=company.id).first()
    pdf_bytes = generate_invoice_pdf(ride, company, driver, settings)
    ref = ride.reference or f"course-{ride.id}"
    filename = f"facture_{ref}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/stats/summary")
def stats_summary(company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Mois courant
    current_month = db.query(func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == now.year,
        extract("month", Ride.ride_at) == now.month,
    ).scalar() or 0

    # Mois précédent (pour delta %)
    prev = now.replace(day=1) - timedelta(days=1)
    prev_month = db.query(func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == prev.year,
        extract("month", Ride.ride_at) == prev.month,
    ).scalar() or 0

    # Courses aujourd'hui vs hier
    rides_today = db.query(func.count(Ride.id)).filter(
        Ride.company_id == company.id,
        func.date(Ride.ride_at) == now.date(),
    ).scalar() or 0

    yesterday = (now - timedelta(days=1)).date()
    rides_yesterday = db.query(func.count(Ride.id)).filter(
        Ride.company_id == company.id,
        func.date(Ride.ride_at) == yesterday,
    ).scalar() or 0

    unpaid = db.query(func.count(Ride.id), func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.status == "pending",
    ).first()

    return {
        "ca_month": float(current_month),
        "ca_prev_month": float(prev_month),
        "rides_today": rides_today,
        "rides_yesterday": rides_yesterday,
        "unpaid_count": unpaid[0] or 0,
        "unpaid_amount": float(unpaid[1] or 0),
    }


@router.get("/stats/monthly")
def stats_monthly(
    year: Optional[int] = None,
    month: Optional[int] = None,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    year = year or now.year
    month = month or now.month

    ca_total = db.query(func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).scalar() or 0

    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    ca_prev = db.query(func.sum(Ride.amount)).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == prev_year,
        extract("month", Ride.ride_at) == prev_month,
    ).scalar() or 0

    rides_count = db.query(func.count(Ride.id)).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).scalar() or 0

    weekly = db.query(
        extract("week", Ride.ride_at).label("week"),
        func.sum(Ride.amount).label("ca"),
        func.count(Ride.id).label("count"),
    ).filter(
        Ride.company_id == company.id,
        Ride.status == "paid",
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).group_by("week").order_by("week").all()

    by_type = db.query(
        Ride.payment_type,
        func.sum(Ride.amount).label("ca"),
        func.count(Ride.id).label("count"),
    ).filter(
        Ride.company_id == company.id,
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).group_by(Ride.payment_type).all()

    by_driver = db.query(
        Driver.id,
        Driver.name,
        func.sum(Ride.amount).label("ca"),
        func.count(Ride.id).label("rides"),
    ).join(Driver, Ride.driver_id == Driver.id, isouter=True).filter(
        Ride.company_id == company.id,
        extract("year", Ride.ride_at) == year,
        extract("month", Ride.ride_at) == month,
    ).group_by(Driver.id, Driver.name).order_by(func.sum(Ride.amount).desc()).all()

    return {
        "year": year,
        "month": month,
        "ca_total": float(ca_total),
        "ca_prev_month": float(ca_prev),
        "rides_count": rides_count,
        "avg_ride": float(ca_total / rides_count) if rides_count else 0,
        "by_week": [{"week": int(r.week or 0), "ca": float(r.ca or 0), "count": r.count} for r in weekly],
        "by_type": [{"type": r.payment_type, "ca": float(r.ca or 0), "count": r.count} for r in by_type],
        "by_driver": [{"name": r.name or "Non assigné", "ca": float(r.ca or 0), "rides": r.rides} for r in by_driver],
    }


# ── CRUD PAR ID (DOIT ÊTRE EN DERNIER) ──────────────────────────────────────

@router.get("/{ride_id}", response_model=RideOut)
def get_ride(ride_id: int, company: Company = Depends(get_current_company), db: Session = Depends(get_db)):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")
    return ride


@router.patch("/{ride_id}", response_model=RideOut)
def update_ride(ride_id: int, body: RideUpdate, request: Request, company: Company = Depends(get_current_company), db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")

    updates = body.model_dump(exclude_none=True)
    was_paid = ride.status == "paid"

    if was_paid and current_user.role not in ("superadmin", "admin"):
        raise HTTPException(
            status_code=403,
            detail="Course déjà payée — seul un admin peut la modifier",
        )
    if was_paid and current_user.role in ("superadmin", "admin"):
        forbidden_fields = {"amount", "reference", "client_name", "payment_type"}
        touched = forbidden_fields & set(updates.keys())
        if touched and updates.get("status") != "pending":
            raise HTTPException(
                status_code=403,
                detail=f"Course payée : impossible de modifier {', '.join(sorted(touched))} sans repasser d'abord en 'En attente'",
            )

    if was_paid:
        log_action(
            db, current_user, "update_paid_ride", "ride",
            entity_id=ride.id,
            details={"fields": list(updates.keys()), "reference": ride.reference},
            request=request,
        )

    for field, value in updates.items():
        setattr(ride, field, value)
    db.commit()
    db.refresh(ride)
    return ride


@router.delete("/{ride_id}", status_code=204)
def delete_ride(ride_id: int, request: Request, company: Company = Depends(get_current_company), db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.company_id == company.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Course introuvable")
    log_action(
        db, current_user, "delete", "ride",
        entity_id=ride.id,
        details={
            "reference": ride.reference,
            "amount": float(ride.amount) if ride.amount else None,
            "status": ride.status,
            "client": ride.client_name,
        },
        request=request,
    )
    db.delete(ride)
    db.commit()
