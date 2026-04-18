"""Tests pour app.config.Settings — validations prod et allowed_origins."""
import pytest
from app.config import Settings


def _make(**overrides):
    defaults = dict(
        database_url="sqlite:///test.db",
        secret_key="a" * 64,
        environment="development",
        allowed_origins="http://localhost:5173",
    )
    defaults.update(overrides)
    return Settings(**defaults)


def test_dev_accepts_weak_secret():
    s = _make(environment="development", secret_key="devkey")
    s.validate_production()  # no raise


def test_prod_rejects_short_secret():
    s = _make(environment="production", secret_key="short")
    with pytest.raises(ValueError, match="SECRET_KEY"):
        s.validate_production()


def test_prod_rejects_dev_in_secret():
    s = _make(environment="production", secret_key="dev" + "x" * 40)
    with pytest.raises(ValueError, match="SECRET_KEY"):
        s.validate_production()


def test_prod_rejects_change_in_secret():
    s = _make(environment="production", secret_key="change-me-please-" + "x" * 20)
    with pytest.raises(ValueError, match="SECRET_KEY"):
        s.validate_production()


def test_prod_accepts_strong_secret():
    s = _make(environment="production", secret_key="Zf9kLm82qR7sNpXwVaYcEdBhGtJuIoPl",
              allowed_origins="https://app.mypilot.fr")
    s.validate_production()


def test_allowed_origins_parses_list():
    s = _make(allowed_origins="http://a.com, http://b.com,http://c.com")
    assert s.get_allowed_origins() == ["http://a.com", "http://b.com", "http://c.com"]


def test_allowed_origins_rejects_empty():
    s = _make(allowed_origins="   ,  ")
    with pytest.raises(ValueError, match="vide"):
        s.get_allowed_origins()


def test_prod_rejects_localhost_origin():
    s = _make(environment="production", allowed_origins="https://app.mypilot.fr,http://localhost:5173")
    with pytest.raises(ValueError, match="locales"):
        s.get_allowed_origins()


def test_prod_rejects_127_origin():
    s = _make(environment="production", allowed_origins="https://app.mypilot.fr,http://127.0.0.1:5173")
    with pytest.raises(ValueError, match="locales"):
        s.get_allowed_origins()


def test_dev_allows_localhost():
    s = _make(environment="development", allowed_origins="http://localhost:5173")
    assert "http://localhost:5173" in s.get_allowed_origins()
