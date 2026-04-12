from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, func
from app.database import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    client_name = Column(String(200), nullable=True)
    origin = Column(String(300), nullable=True)
    destination = Column(String(300), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(String(30), default="cash")  # cash | cpam | mutuelle | card
    status = Column(String(20), default="pending")  # pending | paid | cancelled
    ride_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
