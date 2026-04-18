"""Tests Pydantic Driver + Vehicle."""
import pytest
from datetime import date
from pydantic import ValidationError
from app.schemas.driver import DriverCreate, DriverUpdate
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def test_driver_minimal():
    d = DriverCreate(name="Jean Dupont")
    assert d.name == "Jean Dupont"
    assert d.phone is None


def test_driver_full():
    d = DriverCreate(
        name="Jean",
        phone="0600000000",
        license_number="VTC-001",
        carte_pro_expiry=date(2026, 12, 31),
    )
    assert d.carte_pro_expiry == date(2026, 12, 31)


def test_driver_name_required():
    with pytest.raises(ValidationError):
        DriverCreate()  # type: ignore


def test_driver_update_all_optional():
    u = DriverUpdate()
    assert u.name is None
    assert u.status is None


def test_vehicle_minimal():
    v = VehicleCreate(plate="AB-123-CD")
    assert v.plate == "AB-123-CD"


def test_vehicle_plate_required():
    with pytest.raises(ValidationError):
        VehicleCreate()  # type: ignore


def test_vehicle_full():
    v = VehicleCreate(
        plate="AB-123-CD",
        brand="Peugeot",
        model="508",
        year=2024,
        ct_expiry=date(2026, 6, 1),
    )
    assert v.year == 2024
    assert v.ct_expiry == date(2026, 6, 1)


def test_vehicle_update_partial():
    u = VehicleUpdate(status="maintenance")
    assert u.status == "maintenance"
    assert u.plate is None
