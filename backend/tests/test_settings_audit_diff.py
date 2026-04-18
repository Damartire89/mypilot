"""Tests logique diff audit settings : détection changements + masquage IBAN."""


AUDITED = {"iban", "billing_email", "invoice_prefix", "invoice_next_number",
           "siret", "company_name", "tva_rate"}


def _build_changes(before, after):
    """Reproduit la logique de settings.py update_settings."""
    changes = {}
    for f in AUDITED:
        if before.get(f) != after.get(f):
            old_v, new_v = before.get(f), after.get(f)
            if f == "iban":
                old_v = old_v[-4:] if old_v else None
                new_v = new_v[-4:] if new_v else None
            changes[f] = {"from": old_v, "to": new_v}
    return changes


def test_no_changes_returns_empty_dict():
    before = {"iban": "FR761234567890", "siret": "12345678901234"}
    after = {"iban": "FR761234567890", "siret": "12345678901234"}
    assert _build_changes(before, after) == {}


def test_iban_change_masked():
    before = {"iban": "FR7630006000011234567890189"}
    after = {"iban": "FR7610207123456789012345678"}
    changes = _build_changes(before, after)
    assert "iban" in changes
    # Seuls les 4 derniers chars sont visibles
    assert changes["iban"]["from"] == "0189"
    assert changes["iban"]["to"] == "5678"


def test_iban_set_from_null():
    before = {"iban": None}
    after = {"iban": "FR7630006000011234567890189"}
    changes = _build_changes(before, after)
    assert changes["iban"]["from"] is None
    assert changes["iban"]["to"] == "0189"


def test_prefix_change_not_masked():
    before = {"invoice_prefix": "F"}
    after = {"invoice_prefix": "INV"}
    changes = _build_changes(before, after)
    assert changes["invoice_prefix"] == {"from": "F", "to": "INV"}


def test_multiple_changes():
    before = {"company_name": "Old SARL", "siret": "11111111111111", "iban": None}
    after = {"company_name": "New SAS", "siret": "22222222222222", "iban": "FR7612345678901234"}
    changes = _build_changes(before, after)
    assert "company_name" in changes
    assert "siret" in changes
    assert "iban" in changes
    assert changes["iban"]["to"] == "1234"


def test_non_audited_fields_ignored():
    """Un changement sur un champ non listé (ex: hide_ca) ne doit pas apparaître."""
    before = {"iban": "A"}
    after = {"iban": "A", "hide_ca": True}
    changes = _build_changes(before, after)
    assert changes == {}


def test_audited_set_contains_sensitive_fields():
    assert "iban" in AUDITED
    assert "billing_email" in AUDITED
    assert "siret" in AUDITED
    assert "company_name" in AUDITED
    assert "phone" not in AUDITED  # phone pas sensible → pas audité
    assert "address" not in AUDITED
