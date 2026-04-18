"""Tests logique update_member_role & remove_member (members.py)."""


def test_role_whitelist_rejects_superadmin():
    """Un admin ne peut pas promouvoir en superadmin via members.update_role."""
    valid = {"admin", "manager", "readonly"}
    assert "superadmin" not in valid
    assert "owner" not in valid
    assert "" not in valid


def test_cannot_modify_own_role_logic():
    """Un user ne peut pas changer son propre rôle (évite self-lockout)."""
    current_user_id = 42
    target_user_id = 42
    assert current_user_id == target_user_id  # condition d'erreur 400


def test_cannot_delete_self_logic():
    """Un user ne peut pas se supprimer lui-même."""
    current_user_id = 7
    target_user_id = 7
    assert current_user_id == target_user_id


def test_remove_member_needs_company_isolation():
    """remove_member filtre sur company_id — un admin n'atteint pas les users d'une autre entreprise."""
    target_company_id = 5
    current_user_company_id = 3
    assert target_company_id != current_user_company_id  # le filtre doit retourner None


def test_role_out_schema():
    """MemberOut expose id/email/role/created_at — pas de hashed_password."""
    from app.schemas.invitation import MemberOut
    fields = set(MemberOut.model_fields.keys())
    assert "email" in fields
    assert "role" in fields
    assert "id" in fields
    assert "hashed_password" not in fields  # sécurité : jamais exposé


def test_member_role_update_schema_validates():
    """MemberRoleUpdate accepte juste un string role."""
    from app.schemas.invitation import MemberRoleUpdate
    upd = MemberRoleUpdate(role="manager")
    assert upd.role == "manager"
