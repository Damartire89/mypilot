from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str
    activity_type: str = "taxi"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company_name: str
