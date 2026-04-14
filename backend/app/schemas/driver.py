from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DriverCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    carte_pro_expiry: Optional[date] = None
    carte_vtc_expiry: Optional[date] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    license_number: Optional[str] = None
    carte_pro_expiry: Optional[date] = None
    carte_vtc_expiry: Optional[date] = None


class DriverOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    license_number: Optional[str]
    status: str
    carte_pro_expiry: Optional[date] = None
    carte_vtc_expiry: Optional[date] = None
    carte_pro_alert: Optional[str] = None
    carte_vtc_alert: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
