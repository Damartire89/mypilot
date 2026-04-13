from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from app.database import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False, default="manager")
    token = Column(String(64), nullable=False, unique=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
