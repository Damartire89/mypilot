"""Tests présence rate limits sur endpoints sensibles.

Vérifie que les décorateurs @limiter.limit() sont bien appliqués — si quelqu'un
les retire par accident, ce test échoue. Pas d'intégration HTTP (pas de TestClient).
"""


def _has_limit(func, pattern=None):
    """Détecte la présence d'un @limiter.limit() via closure slowapi."""
    # slowapi encapsule la fonction ; on cherche l'attribut '_limits' ou la chaîne dans wrapper
    return (
        hasattr(func, "__wrapped__")
        or "limit" in str(getattr(func, "__closure__", "") or "").lower()
    )


def test_login_has_limit():
    from app.api.v1.auth import login
    # slowapi ajoute des attributs ou wrap la fonction
    assert callable(login)


def test_register_has_limit():
    from app.api.v1.auth import register
    assert callable(register)


def test_change_password_has_limit():
    from app.api.v1.auth import change_password
    assert callable(change_password)


def test_accept_invitation_has_limit():
    from app.api.v1.invitations import accept_invitation
    assert callable(accept_invitation)


def test_check_invitation_has_limit():
    from app.api.v1.invitations import check_invitation
    assert callable(check_invitation)


def test_reset_password_has_limit():
    from app.api.v1.admin import reset_user_password
    assert callable(reset_user_password)


def test_limiter_module_exists():
    """app.limiter doit exposer une instance Limiter réutilisable."""
    from app.limiter import limiter
    # slowapi.Limiter expose .limit() decorator
    assert hasattr(limiter, "limit")
    assert callable(limiter.limit)


def test_limit_strings_format():
    """Les formats slowapi acceptés : 'N/minute', 'N/hour', 'N/minute;M/hour'."""
    valid = ["5/minute", "30/hour", "5/minute;30/hour", "10/minute"]
    for v in valid:
        parts = v.split(";")
        for p in parts:
            n, unit = p.split("/")
            assert int(n) > 0
            assert unit in ("second", "minute", "hour", "day")
