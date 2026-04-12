from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class RideCreate(BaseModel):
    driver_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    client_name: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    amount: Decimal
    payment_type: str = "cash"
    status: str = "pending"
    ride_at: Optional[datetime] = None


class RideUpdate(BaseModel):
    driver_id: Optional[int] = None
    client_name: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    amount: Optional[Decimal] = None
    payment_type: Optional[str] = None
    status: Optional[str] = None
    ride_at: Optional[datetime] = None


class RideOut(BaseModel):
    id: int
    driver_id: Optional[int]
    vehicle_id: Optional[int]
    client_name: Optional[str]
    origin: Optional[str]
    destination: Optional[str]
    amount: Decimal
    payment_type: str
    status: str
    ride_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
