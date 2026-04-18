"""Tests pour app.pdf.generate_invoice_pdf — smoke tests."""
from types import SimpleNamespace
from datetime import datetime
from decimal import Decimal
from app.pdf import generate_invoice_pdf


def _ride(**overrides):
    defaults = dict(
        id=1, reference="C-2026-0001", client_name="Mme Dupont",
        client_address=None, client_siret=None,
        origin="Paris", destination="Orly", amount=Decimal("50.00"),
        payment_type="cash", status="paid",
        ride_at=datetime(2026, 4, 17, 10, 0),
        bon_transport=None, prescripteur=None, km_distance=None,
        notes=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _company(**overrides):
    defaults = dict(
        name="Taxi Test SARL", siret="12345678901234",
        address="1 rue de Paris", phone="0100000000",
        activity_type="taxi", email="contact@taxitest.fr",
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _settings(**overrides):
    defaults = dict(
        invoice_prefix="F", tva_rate="0", invoice_footer="Merci",
        iban=None, billing_email=None, numero_licence=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_pdf_returns_bytes():
    pdf = generate_invoice_pdf(_ride(), _company(), None, _settings())
    assert isinstance(pdf, bytes)
    assert len(pdf) > 500


def test_pdf_starts_with_magic_bytes():
    pdf = generate_invoice_pdf(_ride(), _company(), None, _settings())
    assert pdf.startswith(b"%PDF")


def test_pdf_without_client_name_still_generates():
    pdf = generate_invoice_pdf(_ride(client_name=None), _company(), None, _settings())
    assert isinstance(pdf, bytes) and pdf.startswith(b"%PDF")


def test_pdf_with_driver():
    driver = SimpleNamespace(name="Jean Dupont", phone="0600000000", license_number="VTC-1")
    pdf = generate_invoice_pdf(_ride(), _company(), driver, _settings())
    assert pdf.startswith(b"%PDF")


def test_pdf_with_client_siret_and_address():
    pdf = generate_invoice_pdf(
        _ride(client_address="12 rue X\n75002 Paris", client_siret="12345678901234"),
        _company(), None, _settings(),
    )
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 500


def test_pdf_without_settings():
    pdf = generate_invoice_pdf(_ride(), _company(), None, None)
    assert pdf.startswith(b"%PDF")
