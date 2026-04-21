from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional


class InviteCreate(BaseModel):
    email: EmailStr
    role: str  # manager | readonly | admin


class InvitationOut(BaseModel):
    id: int
    email: str
    role: str
    token: str
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvitationAccept(BaseModel):
    password: str
    full_name: Optional[str] = None


class MemberOut(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberRoleUpdate(BaseModel):
    role: str  # admin | manager | readonly


class CompanyOut(BaseModel):
    id: int
    name: str
    email: str
    activity_type: str
    created_at: datetime
    member_count: int = 0

    model_config = ConfigDict(from_attributes=True)
