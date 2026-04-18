"""Tests sur la logique IBAN de l'endpoint settings (HTTPException).

Teste la branche de validation de update_settings sans monter de DB/auth —
on simule le comportement directement.
"""
import pytest
from fastapi import HTTPException
from app.api.v1.settings import _validate_iban


def _check_iban_or_raise(iban):
    """Reproduit la logique inline de update_settings pour la validation IBAN."""
    if iban is not None and iban.strip():
        if not _validate_iban(iban):
            raise HTTPException(status_code=400, detail="IBAN invalide (format ou checksum incorrect)")


def test_none_iban_passes():
    _check_iban_or_raise(None)


def test_empty_string_passes():
    _check_iban_or_raise("")


def test_whitespace_only_passes():
    _check_iban_or_raise("   ")


def test_valid_fr_iban_passes():
    _check_iban_or_raise("FR1420041010050500013M02606")


def test_valid_iban_with_spaces_passes():
    _check_iban_or_raise("FR14 2004 1010 0505 0001 3M02 606")


def test_invalid_iban_raises_400():
    with pytest.raises(HTTPException) as exc:
        _check_iban_or_raise("FR0000000000000000000000000")
    assert exc.value.status_code == 400
    assert "IBAN invalide" in exc.value.detail


def test_malformed_iban_raises_400():
    with pytest.raises(HTTPException) as exc:
        _check_iban_or_raise("XX")
    assert exc.value.status_code == 400


def test_non_alphanumeric_raises_400():
    with pytest.raises(HTTPException) as exc:
        _check_iban_or_raise("FR14!!!!!!!!!!!!!!!!!!!!!!!")
    assert exc.value.status_code == 400
