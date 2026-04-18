"""Tests unitaires pour app.audit.log_action."""
import json
from types import SimpleNamespace
from app.audit import log_action
from app.models.audit_log import AuditLog


class _StubSession:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)


class _StubRequest:
    def __init__(self, client_host=None, x_forwarded_for=None):
        self.client = SimpleNamespace(host=client_host) if client_host else None
        self.headers = {}
        if x_forwarded_for:
            self.headers["x-forwarded-for"] = x_forwarded_for


def _user(id=1, company_id=10, email="admin@example.com"):
    return SimpleNamespace(id=id, company_id=company_id, email=email)


def test_log_action_adds_entry_with_user_context():
    db = _StubSession()
    log_action(db, _user(), "delete", "driver", entity_id=42, details={"name": "Jean"})
    assert len(db.added) == 1
    entry = db.added[0]
    assert isinstance(entry, AuditLog)
    assert entry.user_id == 1
    assert entry.company_id == 10
    assert entry.user_email == "admin@example.com"
    assert entry.action == "delete"
    assert entry.entity_type == "driver"
    assert entry.entity_id == 42
    assert json.loads(entry.details) == {"name": "Jean"}


def test_log_action_no_user_context():
    db = _StubSession()
    log_action(db, None, "login_failed", "auth")
    entry = db.added[0]
    assert entry.user_id is None
    assert entry.company_id is None
    assert entry.user_email is None


def test_log_action_no_details():
    db = _StubSession()
    log_action(db, _user(), "access", "rides")
    assert db.added[0].details is None


def test_log_action_extracts_client_ip():
    db = _StubSession()
    req = _StubRequest(client_host="192.168.1.10")
    log_action(db, _user(), "delete", "driver", request=req)
    assert db.added[0].ip_address == "192.168.1.10"


def test_log_action_prefers_x_forwarded_for():
    db = _StubSession()
    req = _StubRequest(client_host="10.0.0.1", x_forwarded_for="203.0.113.5, 10.0.0.1")
    log_action(db, _user(), "delete", "driver", request=req)
    assert db.added[0].ip_address == "203.0.113.5"


def test_log_action_serializes_non_json_types():
    from datetime import datetime
    db = _StubSession()
    ts = datetime(2026, 4, 17, 12, 0)
    log_action(db, _user(), "update", "ride", details={"when": ts})
    parsed = json.loads(db.added[0].details)
    assert "2026-04-17" in parsed["when"]
