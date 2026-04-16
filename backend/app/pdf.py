"""Génération de factures PDF pour myPilot."""
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen.canvas import Canvas

# Couleurs brand
BRAND = HexColor("#0891b2")
BRAND_DARK = HexColor("#162d4a")
GRAY_LIGHT = HexColor("#f0f4f8")
GRAY_MID = HexColor("#94a3b8")
GRAY_TEXT = HexColor("#475569")
DARK_TEXT = HexColor("#1e293b")
SUCCESS = HexColor("#16a34a")
WARNING = HexColor("#d97706")

PAGE_W, PAGE_H = A4  # 595 x 842 pts


def _fr_date(iso_str):
    if not iso_str:
        return "—"
    try:
        d = datetime.fromisoformat(str(iso_str))
        return d.strftime("%d/%m/%Y")
    except Exception:
        return str(iso_str)


def _fr_datetime(iso_str):
    if not iso_str:
        return "—"
    try:
        d = datetime.fromisoformat(str(iso_str))
        return d.strftime("%d/%m/%Y à %Hh%M")
    except Exception:
        return str(iso_str)


PAYMENT_LABELS = {
    "cpam": "CPAM", "mutuelle": "Mutuelle", "cash": "Espèces",
    "card": "Carte bancaire", "virement": "Virement", "cheque": "Chèque",
}
STATUS_LABELS = {"paid": "Payé", "pending": "En attente", "cancelled": "Annulé"}
ACTIVITY_LABELS = {"taxi": "Taxi", "vtc": "VTC", "ambulance": "Ambulance / VSL"}


def generate_invoice_pdf(ride, company, driver, settings) -> bytes:
    buf = BytesIO()
    c = Canvas(buf, pagesize=A4)
    c.setTitle(f"Facture {ride.reference or ride.id}")

    # ── En-tête fond sombre ───────────────────────────────────────────────────
    c.setFillColor(BRAND_DARK)
    c.rect(0, PAGE_H - 60*mm, PAGE_W, 60*mm, fill=1, stroke=0)

    # Nom société
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20*mm, PAGE_H - 22*mm, company.name or "myPilot")

    # Type activité + badge
    activity = ACTIVITY_LABELS.get(company.activity_type or "taxi", "Transport")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#67e8f9"))
    c.drawString(20*mm, PAGE_H - 32*mm, activity.upper())

    # Référence facture (droite)
    ref = ride.reference or f"#{ride.id}"
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    ref_w = c.stringWidth(ref, "Helvetica-Bold", 14)
    c.drawString(PAGE_W - 20*mm - ref_w, PAGE_H - 22*mm, ref)
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#94c8d8"))
    lbl_w = c.stringWidth("RÉFÉRENCE", "Helvetica", 8)
    c.drawString(PAGE_W - 20*mm - lbl_w, PAGE_H - 30*mm, "RÉFÉRENCE")

    # Date d'émission
    today = datetime.now().strftime("%d/%m/%Y")
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#94c8d8"))
    c.drawString(PAGE_W - 20*mm - c.stringWidth(f"Émis le {today}", "Helvetica", 8), PAGE_H - 38*mm, f"Émis le {today}")

    # ── Infos entreprise (sous l'en-tête) ────────────────────────────────────
    y = PAGE_H - 72*mm
    c.setFillColor(GRAY_TEXT)
    c.setFont("Helvetica", 8.5)
    lines = []
    if company.address:
        lines.append(company.address)
    if company.siret:
        lines.append(f"SIRET : {company.siret}")
    if company.phone:
        lines.append(f"Tél : {company.phone}")
    if company.email:
        lines.append(company.email)
    if settings and settings.numero_licence:
        lines.append(f"N° Licence : {settings.numero_licence}")
    if settings and settings.tva_rate:
        lines.append(f"TVA : {settings.tva_rate}%")

    for line in lines:
        c.drawString(20*mm, y, line)
        y -= 5*mm

    # ── Ligne séparatrice ────────────────────────────────────────────────────
    y -= 3*mm
    c.setStrokeColor(HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.line(20*mm, y, PAGE_W - 20*mm, y)
    y -= 8*mm

    # ── Section Course ───────────────────────────────────────────────────────
    def section_title(label, ypos):
        c.setFillColor(BRAND)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(20*mm, ypos, label.upper())
        c.setStrokeColor(BRAND)
        c.setLineWidth(1.5)
        c.line(20*mm, ypos - 1.5*mm, 20*mm + c.stringWidth(label.upper(), "Helvetica-Bold", 8), ypos - 1.5*mm)
        return ypos - 7*mm

    def row(label, value, ypos, bold_value=False):
        c.setFillColor(GRAY_MID)
        c.setFont("Helvetica", 8.5)
        c.drawString(20*mm, ypos, label)
        c.setFillColor(DARK_TEXT)
        c.setFont("Helvetica-Bold" if bold_value else "Helvetica", 8.5)
        c.drawString(80*mm, ypos, str(value) if value else "—")
        return ypos - 6*mm

    y = section_title("Détails de la course", y)

    ride_date = _fr_datetime(ride.ride_at) if ride.ride_at else "—"
    y = row("Date & heure", ride_date, y)
    y = row("Client", ride.client_name or "—", y)
    y = row("Départ", ride.origin or "—", y)
    y = row("Arrivée", ride.destination or "—", y)
    if ride.km_distance:
        y = row("Distance", f"{float(ride.km_distance):.1f} km", y)
    if driver:
        y = row("Chauffeur", driver.name, y)

    y -= 4*mm

    # ── Section Facturation ──────────────────────────────────────────────────
    y = section_title("Facturation", y)

    payment_label = PAYMENT_LABELS.get(ride.payment_type, ride.payment_type or "—")
    y = row("Mode de paiement", payment_label, y)

    status_label = STATUS_LABELS.get(ride.status, ride.status or "—")
    y = row("Statut", status_label, y)

    if settings and settings.tva_rate:
        try:
            tva = float(settings.tva_rate) / 100
            ht = float(ride.amount) / (1 + tva)
            tva_amt = float(ride.amount) - ht
            y = row("Montant HT", f"{ht:.2f} €", y)
            y = row(f"TVA ({settings.tva_rate}%)", f"{tva_amt:.2f} €", y)
        except Exception:
            pass

    # Montant TTC en grand
    y -= 3*mm
    c.setFillColor(GRAY_LIGHT)
    c.roundRect(20*mm, y - 14*mm, PAGE_W - 40*mm, 20*mm, 3*mm, fill=1, stroke=0)
    c.setFillColor(GRAY_TEXT)
    c.setFont("Helvetica", 9)
    c.drawString(25*mm, y - 5*mm, "MONTANT TOTAL TTC")
    amount_str = f"{float(ride.amount):.2f} €"
    c.setFillColor(BRAND_DARK)
    c.setFont("Helvetica-Bold", 16)
    amt_w = c.stringWidth(amount_str, "Helvetica-Bold", 16)
    c.drawString(PAGE_W - 20*mm - amt_w - 5*mm, y - 8*mm, amount_str)
    y -= 22*mm

    # ── Section Médicale (CPAM/Mutuelle) ────────────────────────────────────
    if ride.payment_type in ("cpam", "mutuelle") and (ride.bon_transport or ride.prescripteur):
        y -= 4*mm
        y = section_title("Informations médicales", y)
        if ride.bon_transport:
            y = row("N° bon de transport", ride.bon_transport, y)
        if ride.prescripteur:
            y = row("Médecin prescripteur", ride.prescripteur, y)

    # ── Notes ───────────────────────────────────────────────────────────────
    if ride.notes:
        y -= 4*mm
        y = section_title("Notes", y)
        c.setFillColor(GRAY_TEXT)
        c.setFont("Helvetica", 8.5)
        # Wrap notes sur 100 chars max
        notes = ride.notes
        while notes:
            chunk = notes[:100]
            c.drawString(20*mm, y, chunk)
            notes = notes[100:]
            y -= 5*mm

    # ── Pied de page ────────────────────────────────────────────────────────
    footer_y = 18*mm
    c.setStrokeColor(HexColor("#e2e8f0"))
    c.setLineWidth(0.5)
    c.line(20*mm, footer_y, PAGE_W - 20*mm, footer_y)
    footer_y -= 5*mm

    c.setFillColor(GRAY_MID)
    c.setFont("Helvetica", 7.5)

    footer_parts = []
    if settings and settings.invoice_footer:
        footer_parts.append(settings.invoice_footer)
    else:
        footer_parts.append("Document généré par myPilot — logiciel de gestion de flotte")

    c.drawCentredString(PAGE_W / 2, footer_y, " · ".join(footer_parts))

    if settings and settings.iban:
        footer_y -= 4.5*mm
        c.drawCentredString(PAGE_W / 2, footer_y, f"IBAN : {settings.iban}")

    if settings and settings.billing_email:
        footer_y -= 4.5*mm
        c.drawCentredString(PAGE_W / 2, footer_y, f"Facturation : {settings.billing_email}")

    c.save()
    return buf.getvalue()
