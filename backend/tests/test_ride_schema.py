import pytest
from decimal import Decimal
from pydantic import ValidationError
from app.schemas.ride import RideCreate, RideUpdate


def test_valid_ride_create():
    r = RideCreate(amount=Decimal("50"))
    assert r.amount == Decimal("50")
    assert r.payment_type == "cash"
    assert r.status == "pending"


def test_negative_amount_rejected():
    with pytest.raises(ValidationError):
        RideCreate(amount=Decimal("-5"))


def test_amount_above_max_rejected():
    with pytest.raises(ValidationError):
        RideCreate(amount=Decimal("100000"))


def test_invalid_payment_type_rejected():
    with pytest.raises(ValidationError):
        RideCreate(amount=Decimal("50"), payment_type="bitcoin")


def test_invalid_status_rejected():
    with pytest.raises(ValidationError):
        RideCreate(amount=Decimal("50"), status="wathever")


def test_all_valid_payment_types():
    for pt in ("cash", "cpam", "mutuelle", "card", "virement", "cheque"):
        r = RideCreate(amount=Decimal("10"), payment_type=pt)
        assert r.payment_type == pt


def test_siret_normalization():
    r = RideCreate(amount=Decimal("50"), client_siret="123 456 789 01234")
    assert r.client_siret == "12345678901234"


def test_siret_too_short_rejected():
    with pytest.raises(ValidationError):
        RideCreate(amount=Decimal("50"), client_siret="123")


def test_siret_none_accepted():
    r = RideCreate(amount=Decimal("50"), client_siret=None)
    assert r.client_siret is None


def test_update_partial():
    u = RideUpdate(status="paid")
    assert u.status == "paid"
    assert u.amount is None


def test_update_invalid_status_rejected():
    with pytest.raises(ValidationError):
        RideUpdate(status="whatever")
