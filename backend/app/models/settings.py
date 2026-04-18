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
    show_gasoil_widget = Column(Boolean, default=True)
    currency = Column(String(10), default="EUR")
    date_format = Column(String(20), default="dd/mm/yyyy")
    week_start = Column(String(10), default="monday")

    # Notifications
    notif_new_ride = Column(Boolean, default=True)
    notif_unpaid = Column(Boolean, default=True)
    notif_alerts = Column(Boolean, default=True)
    notif_daily_report = Column(Boolean, default=False)

    # Tarification
    default_km_rate = Column(String(10), default="")         # Tarif /km par défaut (€)
    night_rate_multiplier = Column(String(10), default="")   # Coefficient nuit (ex. 1.5)
    weekend_rate_multiplier = Column(String(10), default="") # Coefficient week-end
    max_ride_amount_alert = Column(String(10), default="")   # Alerte si montant > X€

    # Entreprise étendu
    billing_email = Column(String(200), default="")          # Email facturation (≠ connexion)
    zone_activite = Column(String(100), default="")          # Ville/département d'activité
    numero_licence = Column(String(50), default="")          # Licence taxi / agrément préfectoral
    iban = Column(String(40), default="")
