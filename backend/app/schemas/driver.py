from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DriverCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    license_number: Optional[str] = None


class DriverOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    license_number: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
