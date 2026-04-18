"""Helpers pour calcul des alertes d'expiration (drivers, vehicles)."""
from datetime import date
from typing import Optional


def alert_for_date(expiry_date, today: Optional[date] = None, alert_days: int = 30) -> Optional[str]:
    """Renvoie 'expired', 'expires_in_<n>', ou None selon la date d'expiration."""
    if not expiry_date:
        return None
    today = today or date.today()
    delta = (expiry_date - today).days
    if delta < 0:
        return "expired"
    if delta <= alert_days:
        return f"expires_in_{delta}"
    return None
