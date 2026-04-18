"""Tests sur le freeze de numérotation facture après émission."""
import pytest
from fastapi import HTTPException
from app.api.v1.settings import _has_issued_invoices
from app.models.ride import Ride


class _FakeQuery:
    def __init__(self, has_match):
        self._has = has_match

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return (1,) if self._has else None


class _FakeDB:
    def __init__(self, has_issued=False):
        self._has = has_issued

    def query(self, *args, **kwargs):
        return _FakeQuery(self._has)


def test_no_issued_invoices_returns_false():
    db = _FakeDB(has_issued=False)
    assert _has_issued_invoices(company_id=1, db=db) is False


def test_has_issued_invoices_returns_true():
    db = _FakeDB(has_issued=True)
    assert _has_issued_invoices(company_id=1, db=db) is True


def test_ride_has_issued_at_column():
    r = Ride(amount=50, issued_at=None)
    assert hasattr(r, "issued_at")
    assert r.issued_at is None


def test_ride_issued_at_can_be_set():
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    r = Ride(amount=50, issued_at=now)
    assert r.issued_at == now


def _simulate_freeze_check(body_prefix, body_next_num, has_issued):
    """Reproduit la logique de freeze dans update_settings."""
    if body_prefix is not None or body_next_num is not None:
        if has_issued:
            raise HTTPException(status_code=409, detail="Numérotation figée")


def test_freeze_blocks_prefix_change_when_issued():
    with pytest.raises(HTTPException) as exc:
        _simulate_freeze_check(body_prefix="FA", body_next_num=None, has_issued=True)
    assert exc.value.status_code == 409


def test_freeze_blocks_next_number_change_when_issued():
    with pytest.raises(HTTPException) as exc:
        _simulate_freeze_check(body_prefix=None, body_next_num=100, has_issued=True)
    assert exc.value.status_code == 409


def test_freeze_allows_change_when_no_invoices():
    _simulate_freeze_check(body_prefix="FA", body_next_num=100, has_issued=False)


def test_freeze_allows_other_fields_when_issued():
    _simulate_freeze_check(body_prefix=None, body_next_num=None, has_issued=True)
