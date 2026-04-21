from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    email = Column(String(200), nullable=False, unique=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="admin")  # superadmin | admin | manager | readonly
    created_at = Column(DateTime, server_default=func.now())
