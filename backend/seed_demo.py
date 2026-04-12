"""
Script de seed pour créer des données de démo réalistes.
Usage : python seed_demo.py
Crée une entreprise "Taxi Martin & Fils" avec chauffeurs et courses sur 4 semaines.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DATABASE_URL", "postgresql://mypilot:mypilot@localhost:5432/mypilot")
os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")

from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.driver import Driver
from app.models.ride import Ride
from app.models.vehicle import Vehicle
from app.auth import hash_password
from datetime import datetime, timedelta, date
import random

db = SessionLocal()

# Nettoyage optionnel
print("Nettoyage des données existantes de démonstration...")
existing_company = db.query(Company).filter(Company.email == "demo@taximartin.fr").first()
if existing_company:
    db.query(Ride).filter(Ride.company_id == existing_company.id).delete()
    db.query(Driver).filter(Driver.company_id == existing_company.id).delete()
    db.query(Vehicle).filter(Vehicle.company_id == existing_company.id).delete()
    db.query(User).filter(User.company_id == existing_company.id).delete()
    db.delete(existing_company)
    db.commit()
    print("Données précédentes supprimées.")

# Création entreprise
company = Company(
    name="Taxi Martin & Fils",
    email="demo@taximartin.fr",
    phone="04 91 12 34 56",
    siret="12345678901234",
    activity_type="taxi",
)
db.add(company)
db.flush()

# Utilisateur admin
user = User(
    company_id=company.id,
    email="demo@taximartin.fr",
    hashed_password=hash_password("demo1234"),
    role="admin",
)
db.add(user)
db.flush()

# Chauffeurs
drivers_data = [
    {"name": "Jean-Luc Martin", "phone": "06 12 34 56 78", "status": "active", "license_number": "TXI-2024-001"},
    {"name": "Sophie Renaud", "phone": "06 98 76 54 32", "status": "active", "license_number": "TXI-2024-002"},
    {"name": "Marc Dubois", "phone": "07 11 22 33 44", "status": "break", "license_number": "TXI-2023-089"},
    {"name": "Lucie Fontaine", "phone": "06 55 66 77 88", "status": "off", "license_number": "TXI-2024-003"},
]
drivers = []
for d in drivers_data:
    driver = Driver(company_id=company.id, **d)
    db.add(driver)
    db.flush()
    drivers.append(driver)

# Véhicules
today = date.today()
vehicles_data = [
    {
        "plate": "AB-123-CD",
        "brand": "Renault",
        "model": "Trafic",
        "year": 2022,
        "status": "available",
        "ct_expiry": date(today.year + 1, 3, 15),
        "insurance_expiry": today + timedelta(days=45),
    },
    {
        "plate": "EF-456-GH",
        "brand": "Peugeot",
        "model": "Expert",
        "year": 2021,
        "status": "in_use",
        "ct_expiry": today + timedelta(days=18),  # CT bientôt (dans 18 jours)
        "insurance_expiry": date(today.year + 1, 6, 30),
    },
    {
        "plate": "IJ-789-KL",
        "brand": "Citroën",
        "model": "Berlingo",
        "year": 2020,
        "status": "maintenance",
        "ct_expiry": today - timedelta(days=45),  # Expiré !
        "insurance_expiry": date(today.year + 1, 9, 1),
    },
    {
        "plate": "MN-012-OP",
        "brand": "Ford",
        "model": "Transit",
        "year": 2023,
        "status": "available",
        "ct_expiry": date(today.year + 2, 1, 20),
        "insurance_expiry": date(today.year + 1, 1, 15),
    },
]
for v in vehicles_data:
    vehicle = Vehicle(company_id=company.id, **v)
    db.add(vehicle)
db.flush()

# Courses sur 4 semaines (mois courant)
now = datetime.utcnow()
first_day = now.replace(day=1, hour=8, minute=0, second=0)

ride_templates = [
    {"client_name": "Mme Dupont", "origin": "12 rue de la Paix", "destination": "CHU Nord", "amount": 47, "payment_type": "cpam"},
    {"client_name": "M. Bernard", "origin": "Clinique du Parc", "destination": "3 allée des Roses", "amount": 32, "payment_type": "cpam"},
    {"client_name": "Course aéroport", "origin": "Aéroport Marseille", "destination": "Centre-ville", "amount": 68, "payment_type": "cash"},
    {"client_name": "Mme Lefèvre", "origin": "Résidence Les Pins", "destination": "CHU Timone", "amount": 55, "payment_type": "cpam"},
    {"client_name": "M. Rousseau", "origin": "Gare Saint-Charles", "destination": "Hôpital Nord", "amount": 29, "payment_type": "cpam"},
    {"client_name": "Mme Martin", "origin": "44 cours Julien", "destination": "Cabinet médical Estaque", "amount": 18, "payment_type": "mutuelle"},
    {"client_name": "M. Petit", "origin": "Vieux-Port", "destination": "Hôpital Sainte-Marguerite", "amount": 41, "payment_type": "cpam"},
    {"client_name": "Course privée", "origin": "Hôtel Sofitel", "destination": "Palais des Congrès", "amount": 35, "payment_type": "card"},
    {"client_name": "Mme Garcia", "origin": "2 bd Longchamp", "destination": "Polyclinique du Parc", "amount": 52, "payment_type": "mutuelle"},
    {"client_name": "M. Moreau", "origin": "Place Castellane", "destination": "Clinique Vallier", "amount": 23, "payment_type": "cpam"},
]

rides_created = 0
day = first_day
driver_idx = 0

while day.month == now.month:
    # 3-6 courses par jour ouvré
    if day.weekday() < 6:  # Lundi-Samedi
        n_rides = random.randint(3, 6)
        hour = 7
        for _ in range(n_rides):
            template = random.choice(ride_templates)
            ride_time = day.replace(hour=hour, minute=random.choice([0, 15, 30, 45]))

            # Statut : tout payé sauf les 2 derniers jours
            days_ago = (now - day).days
            if days_ago <= 2:
                status = random.choice(["pending", "pending", "paid"])
            else:
                status = "paid"

            ride = Ride(
                company_id=company.id,
                driver_id=drivers[driver_idx % len(drivers)].id,
                client_name=template["client_name"],
                origin=template["origin"],
                destination=template["destination"],
                amount=template["amount"],
                payment_type=template["payment_type"],
                status=status,
                ride_at=ride_time,
            )
            db.add(ride)
            rides_created += 1
            driver_idx += 1
            hour += random.randint(1, 2)
            if hour >= 20:
                break

    day += timedelta(days=1)

db.commit()
db.close()

print(f"""
Données de démo créées avec succès !

Connexion :
  Email    : demo@taximartin.fr
  Password : demo1234

Statistiques :
  Chauffeurs : {len(drivers)}
  Véhicules  : {len(vehicles_data)}
  Courses    : {rides_created}

Serveur    : http://localhost:8002
Frontend   : http://localhost:4174
""")
