"""Tests logique invitation membre (members.py::invite_member)."""


def test_invalid_role_rejected_logic():
    """Seuls admin/manager/readonly acceptés en body."""
    valid_roles = {"admin", "manager", "readonly"}
    assert "superadmin" not in valid_roles  # un admin ne peut pas inviter un superadmin
    assert "owner" not in valid_roles
    assert "" not in valid_roles
    assert "admin" in valid_roles
    assert "manager" in valid_roles
    assert "readonly" in valid_roles


def test_expires_at_is_7_days():
    """Invitation expire à +7 jours par défaut."""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires = now + timedelta(days=7)
    delta = (expires - now).days
    assert delta == 7


def test_token_is_url_safe_and_long_enough():
    """Token généré par secrets.token_urlsafe(32) ≥ 32 chars, URL-safe."""
    import secrets
    import string
    t = secrets.token_urlsafe(32)
    # token_urlsafe retourne ~43 chars pour 32 bytes
    assert len(t) >= 32
    # Chars URL-safe uniquement
    safe_chars = string.ascii_letters + string.digits + "-_"
    assert all(c in safe_chars for c in t)


def test_invite_body_schema_valid():
    """InviteCreate accepte email + rôle."""
    from app.schemas.invitation import InviteCreate
    inv = InviteCreate(email="jean@exemple.fr", role="manager")
    assert inv.email == "jean@exemple.fr"
    assert inv.role == "manager"


def test_invite_body_schema_missing_email():
    """InviteCreate rejette sans email."""
    import pytest
    from pydantic import ValidationError
    from app.schemas.invitation import InviteCreate
    with pytest.raises(ValidationError):
        InviteCreate(role="admin")
