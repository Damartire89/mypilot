from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

PAYMENT_TYPES = {"cash", "cpam", "mutuelle", "card", "virement", "cheque"}
RIDE_STATUSES = {"pending", "paid", "cancelled"}
MAX_AMOUNT = Decimal("99999")


def _validate_siret(v: Optional[str]) -> Optional[str]:
    if v is None or v == "":
        return v
    digits = "".join(c for c in v if c.isdigit())
    if len(digits) != 14:
        raise ValueError("Le SIRET doit contenir exactement 14 chiffres")
    return digits


class RideCreate(BaseModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_siret: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    amount: Decimal
    payment_type: str = "cash"
    status: str = "pending"
    ride_at: Optional[datetime] = None
    bon_transport: Optional[str] = None
    prescripteur: Optional[str] = None
    notes: Optional[str] = None
    km_distance: Optional[Decimal] = None
    reference: Optional[str] = None

    @field_validator("client_siret")
    @classmethod
    def _check_siret(cls, v: Optional[str]) -> Optional[str]:
        return _validate_siret(v)

    @field_validator("payment_type")
    @classmethod
    def _check_payment_type(cls, v: str) -> str:
        if v not in PAYMENT_TYPES:
            raise ValueError(f"Type de paiement invalide — valeurs acceptées : {sorted(PAYMENT_TYPES)}")
        return v

    @field_validator("status")
    @classmethod
    def _check_status(cls, v: str) -> str:
        if v not in RIDE_STATUSES:
            raise ValueError(f"Statut invalide — valeurs acceptées : {sorted(RIDE_STATUSES)}")
        return v

    @field_validator("amount")
    @classmethod
    def _check_amount(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Le montant ne peut pas être négatif")
        if v > MAX_AMOUNT:
            raise ValueError(f"Le montant ne peut pas dépasser {MAX_AMOUNT} €")
        return v


class RideUpdate(BaseModel):
    driver_id: Optional[int] = None
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_siret: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_type: Optional[str] = None
    status: Optional[str] = None
    ride_at: Optional[datetime] = None
    bon_transport: Optional[str] = None
    prescripteur: Optional[str] = None
    notes: Optional[str] = None
    km_distance: Optional[Decimal] = None
    reference: Optional[str] = None

    @field_validator("client_siret")
    @classmethod
    def _check_siret(cls, v: Optional[str]) -> Optional[str]:
        return _validate_siret(v)

    @field_validator("payment_type")
    @classmethod
    def _check_payment_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PAYMENT_TYPES:
            raise ValueError(f"Type de paiement invalide — valeurs acceptées : {sorted(PAYMENT_TYPES)}")
        return v

    @field_validator("status")
    @classmethod
    def _check_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in RIDE_STATUSES:
            raise ValueError(f"Statut invalide — valeurs acceptées : {sorted(RIDE_STATUSES)}")
        return v

    @field_validator("amount")
    @classmethod
    def _check_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Le montant ne peut pas être négatif")
        if v > MAX_AMOUNT:
            raise ValueError(f"Le montant ne peut pas dépasser {MAX_AMOUNT} €")
        return v


class RideOut(BaseModel):
    id: int
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    client_name: Optional[str]
    client_address: Optional[str] = None
    client_siret: Optional[str] = None
    origin: Optional[str]
    destination: Optional[str]
    amount: Decimal
    payment_type: str
    status: str
    ride_at: Optional[datetime]
    bon_transport: Optional[str] = None
    prescripteur: Optional[str] = None
    notes: Optional[str] = None
    km_distance: Optional[Decimal] = None
    reference: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
