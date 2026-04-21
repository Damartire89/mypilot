from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, func
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    plate = Column(String(20), nullable=False)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    status = Column(String(20), default="available")  # available | in_use | maintenance
    ct_expiry = Column(Date, nullable=True)
    insurance_expiry = Column(Date, nullable=True)
    # Documents FR
    ads_expiry = Column(Date, nullable=True)          # Autorisation de Stationnement (taxi)
    taximetre_expiry = Column(Date, nullable=True)    # Vignette vérification taximètre
    created_at = Column(DateTime, server_default=func.now())
