from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class VehicleCreate(BaseModel):
    plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    ct_expiry: Optional[date] = None
    insurance_expiry: Optional[date] = None
    ads_expiry: Optional[date] = None
    taximetre_expiry: Optional[date] = None


class VehicleUpdate(BaseModel):
    plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    status: Optional[str] = None
    ct_expiry: Optional[date] = None
    insurance_expiry: Optional[date] = None
    ads_expiry: Optional[date] = None
    taximetre_expiry: Optional[date] = None


class VehicleOut(BaseModel):
    id: int
    plate: str
    brand: Optional[str]
    model: Optional[str]
    year: Optional[int]
    status: str
    ct_expiry: Optional[date]
    insurance_expiry: Optional[date]
    ads_expiry: Optional[date] = None
    taximetre_expiry: Optional[date] = None
    created_at: datetime
    ct_alert: Optional[str] = None
    insurance_alert: Optional[str] = None
    ads_alert: Optional[str] = None
    taximetre_alert: Optional[str] = None

    model_config = {"from_attributes": True}
