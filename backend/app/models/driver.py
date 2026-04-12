from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    license_number = Column(String(50), nullable=True)
    status = Column(String(20), default="off")  # active | break | off
    created_at = Column(DateTime, server_default=func.now())
