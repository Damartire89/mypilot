from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, func
from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    license_number = Column(String(50), nullable=True)
    status = Column(String(20), default="off")  # active | break | off
    # Documents FR
    carte_pro_expiry = Column(Date, nullable=True)   # Carte professionnelle taxi (préfecture)
    carte_vtc_expiry = Column(Date, nullable=True)   # Carte VTC (ARPE)
    created_at = Column(DateTime, server_default=func.now())
