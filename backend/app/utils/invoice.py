"""Helpers pour numérotation de facture."""
from typing import Optional


def format_invoice_reference(prefix: Optional[str], year: int, number: int) -> str:
    """Formate une référence de facture : PREFIX-YEAR-NNNN (N padded à 4 chiffres)."""
    p = (prefix or "C").strip() or "C"
    n = max(1, int(number))
    return f"{p}-{year}-{n:04d}"
