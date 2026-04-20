"""Génération du Fichier des Écritures Comptables (FEC) — spec DGFiP.

Article A47 A-1 du Livre des procédures fiscales. Format texte, 18 champs
séparés par pipe `|`, fin de ligne CRLF, encodage UTF-8 (BOM accepté).
Montants au format français : virgule décimale, pas de séparateur de milliers.

Pour chaque course avec facture émise (issued_at NOT NULL) on génère DEUX
lignes équilibrées :
  - Débit compte client 411 (créance client)
  - Crédit compte produit 706 (prestations de services)

Les courses sans facture (issued_at NULL) sont ignorées — pas d'écriture
comptable tant que non facturé.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Iterable

FEC_HEADERS = [
    "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
    "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
    "PieceRef", "PieceDate", "EcritureLib", "Debit",
    "Credit", "EcritureLet", "DateLet", "ValidDate",
    "Montantdevise", "Idevise",
]

JOURNAL_CODE = "VT"
JOURNAL_LIB = "Ventes"
ACCOUNT_CLIENT = "411000"
ACCOUNT_CLIENT_LIB = "Clients"
ACCOUNT_PRODUCT = "706000"
ACCOUNT_PRODUCT_LIB = "Prestations de services"


def _fmt_date(dt: datetime | None) -> str:
    """Format AAAAMMJJ requis par le FEC."""
    if dt is None:
        return ""
    return dt.strftime("%Y%m%d")


def _fmt_amount(value: Decimal | float | int | None) -> str:
    """Format montant FR : virgule décimale, 2 décimales. Chaîne vide si 0."""
    if value is None:
        return ""
    d = Decimal(str(value)).quantize(Decimal("0.01"))
    if d == 0:
        return ""
    return f"{d:.2f}".replace(".", ",")


def _sanitize(text: str | None) -> str:
    """Retire les séparateurs du FEC (pipe, tab, retour ligne)."""
    if not text:
        return ""
    return text.replace("|", " ").replace("\t", " ").replace("\n", " ").replace("\r", " ").strip()


def _aux_num(ride_id: int, client_name: str | None) -> str:
    """Compte auxiliaire client : C + id ride (stable, court). 17 chars max."""
    return f"C{ride_id:09d}"


def build_fec(rides_issued: Iterable, company_name: str) -> str:
    """Retourne le contenu FEC complet (header + lignes) pour les rides donnés.

    `rides_issued` : itérable de Ride avec `issued_at` NOT NULL.
    Chaque ride génère 2 lignes (débit client + crédit produit), donc
    total_debit == total_credit par construction.
    """
    lines: list[str] = []
    lines.append("|".join(FEC_HEADERS))

    # Tri par date d'émission pour EcritureNum séquentiel stable
    sorted_rides = sorted(
        rides_issued,
        key=lambda r: (r.issued_at or datetime.min, r.id),
    )

    for idx, ride in enumerate(sorted_rides, start=1):
        ecr_num = f"{idx:06d}"
        ecr_date = _fmt_date(ride.issued_at)
        piece_ref = _sanitize(ride.reference) or f"C{ride.id}"
        piece_date = ecr_date
        label = _sanitize(f"Course {ride.reference or ride.id} - {ride.client_name or 'Client'}")[:200]
        amount = _fmt_amount(ride.amount)
        aux_num = _aux_num(ride.id, ride.client_name)
        aux_lib = _sanitize(ride.client_name)[:60]
        valid_date = ecr_date

        base = {
            "JournalCode": JOURNAL_CODE,
            "JournalLib": JOURNAL_LIB,
            "EcritureNum": ecr_num,
            "EcritureDate": ecr_date,
            "PieceRef": piece_ref,
            "PieceDate": piece_date,
            "EcritureLib": label,
            "EcritureLet": "",
            "DateLet": "",
            "ValidDate": valid_date,
            "Montantdevise": "",
            "Idevise": "",
        }

        # Ligne 1 : Débit client 411
        lines.append("|".join([
            base["JournalCode"], base["JournalLib"], base["EcritureNum"], base["EcritureDate"],
            ACCOUNT_CLIENT, ACCOUNT_CLIENT_LIB, aux_num, aux_lib,
            base["PieceRef"], base["PieceDate"], base["EcritureLib"], amount,
            "", base["EcritureLet"], base["DateLet"], base["ValidDate"],
            base["Montantdevise"], base["Idevise"],
        ]))

        # Ligne 2 : Crédit produit 706
        lines.append("|".join([
            base["JournalCode"], base["JournalLib"], base["EcritureNum"], base["EcritureDate"],
            ACCOUNT_PRODUCT, ACCOUNT_PRODUCT_LIB, "", "",
            base["PieceRef"], base["PieceDate"], base["EcritureLib"], "",
            amount, base["EcritureLet"], base["DateLet"], base["ValidDate"],
            base["Montantdevise"], base["Idevise"],
        ]))

    return "\r\n".join(lines) + "\r\n"


def fec_filename(siret: str | None, year: int) -> str:
    """Nom de fichier FEC normé : SIREN + FEC + AAAAMMJJ (date clôture)."""
    siren = (siret or "000000000")[:9]
    close_date = f"{year}1231"
    return f"{siren}FEC{close_date}.txt"
