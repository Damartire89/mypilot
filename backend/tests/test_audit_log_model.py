"""Tests basiques sur le modèle AuditLog."""
from app.models.audit_log import AuditLog


def test_audit_log_instantiable_with_required_fields():
    a = AuditLog(action="delete", entity_type="driver")
    assert a.action == "delete"
    assert a.entity_type == "driver"


def test_audit_log_optional_fields_default_none():
    a = AuditLog(action="login", entity_type="auth")
    assert a.entity_id is None
    assert a.details is None
    assert a.ip_address is None
    assert a.user_id is None
    assert a.user_email is None
    assert a.company_id is None


def test_audit_log_stores_details_as_text():
    a = AuditLog(action="update", entity_type="ride", details='{"from": 10, "to": 20}')
    assert "from" in a.details
