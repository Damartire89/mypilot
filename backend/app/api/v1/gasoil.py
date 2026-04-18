"""
Endpoint prix du gasoil — données officielles gouvernement FR.
Source : data.economie.gouv.fr (Prix des carburants en France)
"""
import urllib.request
import json
import threading
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.auth import get_current_user
from app.models.user import User
from fastapi import Depends

router = APIRouter(prefix="/gasoil", tags=["gasoil"])

# Cache en mémoire : 1h de TTL pour éviter de taper l'API à chaque requête.
# Lock nécessaire car FastAPI peut appeler en threadpool (plusieurs workers threads).
_cache: dict = {"data": None, "fetched_at": None}
_cache_lock = threading.Lock()
CACHE_TTL_SECONDS = 3600

FUEL_LABELS = {
    "Gazole": "Gazole",
    "SP95": "SP95",
    "SP98": "SP98",
    "E10": "E10",
    "GPLc": "GPL",
}


def _fetch_prix_nationaux() -> dict:
    """Récupère les prix moyens nationaux depuis l'API gouvernementale."""
    url = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix_des_carburants_en_france_flux_instantane_v2/records?limit=100&order_by=prix_maj%20desc"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "myPilot/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            raw = json.loads(resp.read().decode())

        # Calculer prix moyen par carburant sur tous les résultats
        totals: dict = {}
        counts: dict = {}
        for record in raw.get("results", []):
            carburant = record.get("nom_carburant")
            prix = record.get("prix_valeur")
            if carburant and prix:
                totals[carburant] = totals.get(carburant, 0) + float(prix)
                counts[carburant] = counts.get(carburant, 0) + 1

        result = {}
        for carburant, label in FUEL_LABELS.items():
            if carburant in totals and counts[carburant] > 0:
                result[label] = round(totals[carburant] / counts[carburant], 3)

        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Impossible de récupérer les prix carburant : {str(e)}")


def _cache_is_fresh(now: datetime) -> bool:
    return (
        _cache["data"] is not None
        and _cache["fetched_at"] is not None
        and (now - _cache["fetched_at"]).total_seconds() < CACHE_TTL_SECONDS
    )


@router.get("")
def get_prix_gasoil(_: User = Depends(get_current_user)):
    """Retourne les prix moyens nationaux des carburants (cache 1h, thread-safe)."""
    now = datetime.now(timezone.utc)

    with _cache_lock:
        if _cache_is_fresh(now):
            return {**_cache["data"], "cached": True, "fetched_at": _cache["fetched_at"].isoformat()}

    prix = _fetch_prix_nationaux()

    with _cache_lock:
        _cache["data"] = {"prix": prix}
        _cache["fetched_at"] = now

    return {"prix": prix, "cached": False, "fetched_at": now.isoformat()}
