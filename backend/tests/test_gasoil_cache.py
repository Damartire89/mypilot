"""Tests cache gasoil (TTL + thread-safety)."""
from datetime import datetime, timezone, timedelta
from app.api.v1 import gasoil


def _reset_cache():
    gasoil._cache["data"] = None
    gasoil._cache["fetched_at"] = None


def test_cache_empty_not_fresh():
    _reset_cache()
    assert not gasoil._cache_is_fresh(datetime.now(timezone.utc))


def test_cache_fresh_when_recent():
    _reset_cache()
    now = datetime.now(timezone.utc)
    gasoil._cache["data"] = {"prix": {"Gazole": 1.85}}
    gasoil._cache["fetched_at"] = now
    assert gasoil._cache_is_fresh(now)


def test_cache_expired_after_ttl():
    _reset_cache()
    now = datetime.now(timezone.utc)
    gasoil._cache["data"] = {"prix": {"Gazole": 1.85}}
    gasoil._cache["fetched_at"] = now - timedelta(seconds=gasoil.CACHE_TTL_SECONDS + 10)
    assert not gasoil._cache_is_fresh(now)


def test_cache_fresh_at_boundary():
    _reset_cache()
    now = datetime.now(timezone.utc)
    gasoil._cache["data"] = {"prix": {"Gazole": 1.85}}
    gasoil._cache["fetched_at"] = now - timedelta(seconds=gasoil.CACHE_TTL_SECONDS - 1)
    assert gasoil._cache_is_fresh(now)


def test_cache_lock_exists():
    assert gasoil._cache_lock is not None
    with gasoil._cache_lock:
        pass
