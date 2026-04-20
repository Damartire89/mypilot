"""Tests du générateur FEC."""
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace

from app.fec import (
    build_fec,
    fec_filename,
    FEC_HEADERS,
    _fmt_date,
    _fmt_amount,
    _sanitize,
)


def _ride(id, amount, issued_at, client_name="Jean Dupont", reference=None):
    return SimpleNamespace(
        id=id,
        amount=Decimal(str(amount)),
        issued_at=issued_at,
        client_name=client_name,
        reference=reference,
    )


def test_fmt_date_aaammjj():
    assert _fmt_date(datetime(2026, 3, 15)) == "20260315"
    assert _fmt_date(None) == ""


def test_fmt_amount_fr():
    assert _fmt_amount(Decimal("42.50")) == "42,50"
    assert _fmt_amount(Decimal("1000")) == "1000,00"
    assert _fmt_amount(0) == ""
    assert _fmt_amount(None) == ""


def test_sanitize_strips_separators():
    assert _sanitize("a|b\tc\nd\re") == "a b c d e"
    assert _sanitize(None) == ""
    assert _sanitize("  normal  ") == "normal"


def test_build_fec_empty_has_only_header():
    content = build_fec([], "Taxi Test")
    lines = content.strip("\r\n").split("\r\n")
    assert len(lines) == 1
    assert lines[0] == "|".join(FEC_HEADERS)
    assert len(FEC_HEADERS) == 18


def test_build_fec_two_lines_per_ride():
    rides = [_ride(1, "42.50", datetime(2026, 3, 15), reference="C-2026-0001")]
    content = build_fec(rides, "Taxi Test")
    lines = content.strip("\r\n").split("\r\n")
    assert len(lines) == 3  # header + 2


def test_build_fec_balanced_debit_credit():
    """Chaque course : 1 ligne débit client, 1 ligne crédit produit, montant égal."""
    rides = [
        _ride(1, "42.50", datetime(2026, 3, 15)),
        _ride(2, "100.00", datetime(2026, 3, 16)),
        _ride(3, "7.25", datetime(2026, 3, 17)),
    ]
    content = build_fec(rides, "Taxi Test")
    lines = content.strip("\r\n").split("\r\n")[1:]  # skip header

    total_debit = Decimal("0")
    total_credit = Decimal("0")
    for line in lines:
        cols = line.split("|")
        debit = cols[11].replace(",", ".") or "0"
        credit = cols[12].replace(",", ".") or "0"
        total_debit += Decimal(debit)
        total_credit += Decimal(credit)

    assert total_debit == Decimal("149.75")
    assert total_credit == Decimal("149.75")
    assert total_debit == total_credit


def test_build_fec_client_account_on_debit():
    rides = [_ride(42, "50", datetime(2026, 1, 1), client_name="Société X")]
    content = build_fec(rides, "Taxi Test")
    lines = content.strip("\r\n").split("\r\n")[1:]
    cols_debit = lines[0].split("|")
    cols_credit = lines[1].split("|")

    assert cols_debit[4] == "411000"
    assert cols_credit[4] == "706000"
    assert cols_debit[6] == "C000000042"  # compte auxiliaire
    assert "Société X" in cols_debit[7]
    assert cols_credit[6] == ""  # pas d'aux sur compte produit


def test_build_fec_ordered_by_issued_at():
    rides = [
        _ride(3, "10", datetime(2026, 3, 20)),
        _ride(1, "10", datetime(2026, 3, 10)),
        _ride(2, "10", datetime(2026, 3, 15)),
    ]
    content = build_fec(rides, "Taxi Test")
    lines = content.strip("\r\n").split("\r\n")[1:]
    # EcritureNum 000001 en premier → doit être ride id=1 (date plus ancienne)
    first_debit = lines[0].split("|")
    assert first_debit[2] == "000001"
    assert first_debit[6] == "C000000001"


def test_fec_filename_norme_dgfip():
    assert fec_filename("12345678901234", 2026) == "123456789FEC20261231.txt"
    assert fec_filename(None, 2025) == "000000000FEC20251231.txt"
    assert fec_filename("", 2024) == "000000000FEC20241231.txt"


def test_build_fec_sanitizes_pipe_in_client_name():
    rides = [_ride(1, "10", datetime(2026, 1, 1), client_name="Jean|Dupont")]
    content = build_fec(rides, "Taxi")
    lines = content.strip("\r\n").split("\r\n")[1:]
    # Chaque ligne doit avoir exactement 18 colonnes
    assert len(lines[0].split("|")) == 18
    assert len(lines[1].split("|")) == 18
