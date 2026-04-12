from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from app.database import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)

    # Facturation
    invoice_prefix = Column(String(20), default="FAC")
    invoice_next_number = Column(Integer, default=1)
    tva_rate = Column(String(10), default="10")
    invoice_footer = Column(Text, default="")
    enabled_payments = Column(Text, default="CPAM,Espèces,Carte bancaire")  # CSV

    # Alertes
    enabled_alerts = Column(Text, default="CT véhicule,Assurance,Révision")  # CSV
    alert_days_before = Column(Integer, default=30)

    # Affichage
    hide_ca = Column(Boolean, default=False)
    currency = Column(String(10), default="EUR")
    date_format = Column(String(20), default="dd/mm/yyyy")
    week_start = Column(String(10), default="monday")

    # Notifications
    notif_new_ride = Column(Boolean, default=True)
    notif_unpaid = Column(Boolean, default=True)
    notif_alerts = Column(Boolean, default=True)
    notif_daily_report = Column(Boolean, default=False)
