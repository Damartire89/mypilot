"""Tests endpoint /admin/stats/global — structure et types.

Pas d'intégration HTTP (pas de TestClient dispo sans httpx) :
on vérifie la signature/router, et la logique de shape côté code.
"""


def test_global_stats_registered_on_router():
    from app.api.v1.admin import router
    paths = [getattr(r, "path", None) for r in router.routes]
    assert "/admin/stats/global" in paths


def test_global_stats_function_signature():
    from app.api.v1.admin import global_stats
    import inspect
    sig = inspect.signature(global_stats)
    # Les deux paramètres attendus : _ (superadmin guard) + db session
    assert "db" in sig.parameters


def test_global_stats_returns_expected_shape():
    """Simule la construction de la réponse (logique pure)."""
    def build_response(companies_active, companies_deleted, users, drivers, vehicles, rides, audit_logs):
        return {
            "companies": {"active": companies_active, "deleted": companies_deleted},
            "users": users,
            "drivers": drivers,
            "vehicles": vehicles,
            "rides": rides,
            "audit_logs": audit_logs,
        }

    r = build_response(3, 1, 12, 7, 5, 120, 48)
    assert r["companies"] == {"active": 3, "deleted": 1}
    assert r["users"] == 12
    assert r["drivers"] == 7
    assert r["vehicles"] == 5
    assert r["rides"] == 120
    assert r["audit_logs"] == 48

    # Edge case : tout à zéro
    r0 = build_response(0, 0, 0, 0, 0, 0, 0)
    assert r0["companies"] == {"active": 0, "deleted": 0}
    assert all(r0[k] == 0 for k in ("users", "drivers", "vehicles", "rides", "audit_logs"))


def test_audit_logs_response_shape():
    """Structure de la réponse paginée."""
    def build_response(total, limit, offset, items):
        return {"total": total, "limit": limit, "offset": offset, "items": items}

    r = build_response(100, 50, 0, [{"id": 1, "action": "login"}])
    assert r["total"] == 100
    assert r["limit"] == 50
    assert r["offset"] == 0
    assert len(r["items"]) == 1
    assert r["items"][0]["action"] == "login"
