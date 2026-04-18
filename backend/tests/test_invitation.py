"""Tests pour schemas invitation + allowed roles."""
import pytest
from pydantic import ValidationError
from app.schemas.invitation import InviteCreate, InvitationAccept, MemberRoleUpdate
from app.api.v1.invitations import _ALLOWED_INVITE_ROLES


def test_allowed_invite_roles_set():
    assert _ALLOWED_INVITE_ROLES == {"admin", "manager", "readonly"}


def test_superadmin_not_allowed_as_invite_role():
    assert "superadmin" not in _ALLOWED_INVITE_ROLES


def test_invite_create_valid():
    inv = InviteCreate(email="new@example.com", role="manager")
    assert inv.email == "new@example.com"
    assert inv.role == "manager"


def test_invite_create_rejects_invalid_email():
    with pytest.raises(ValidationError):
        InviteCreate(email="not-an-email", role="manager")


def test_invitation_accept_minimal():
    acc = InvitationAccept(password="hunter2secret")
    assert acc.password == "hunter2secret"
    assert acc.full_name is None


def test_member_role_update():
    r = MemberRoleUpdate(role="admin")
    assert r.role == "admin"
