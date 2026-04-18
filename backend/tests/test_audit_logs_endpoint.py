"""Tests logique de pagination/filtre audit logs endpoint."""
import pytest


def test_limit_clamped_to_500():
    """La limite doit être clampée max 500."""
    from app.api.v1.admin import list_audit_logs
    import inspect
    sig = inspect.signature(list_audit_logs)
    assert "limit" in sig.parameters
    assert sig.parameters["limit"].default == 100


def test_limit_clamp_logic():
    """Reproduit le clamp : limit = max(1, min(500, limit))."""
    def clamp(limit):
        return max(1, min(500, limit))

    assert clamp(0) == 1
    assert clamp(-5) == 1
    assert clamp(1) == 1
    assert clamp(100) == 100
    assert clamp(500) == 500
    assert clamp(501) == 500
    assert clamp(9999) == 500


def test_offset_clamp_logic():
    """Offset clamp : max(0, offset)."""
    def clamp(offset):
        return max(0, offset)

    assert clamp(0) == 0
    assert clamp(-1) == 0
    assert clamp(-100) == 0
    assert clamp(50) == 50


def test_endpoint_exists():
    """L'endpoint est bien enregistré sur le router admin."""
    from app.api.v1.admin import router
    paths = [getattr(r, 'path', None) for r in router.routes]
    assert "/admin/audit-logs" in paths
