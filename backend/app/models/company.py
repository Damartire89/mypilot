from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    siret = Column(String(14), unique=True, nullable=True)
    email = Column(String(200), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    activity_type = Column(String(20), default="taxi")  # taxi | vtc | ambulance
    address = Column(String(300), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
