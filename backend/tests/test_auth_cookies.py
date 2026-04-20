"""Tests pour les cookies d'authentification et la protection CSRF."""
from unittest.mock import MagicMock
from fastapi import Response
from starlette.requests import Request

from app.cookies import (
    ACCESS_COOKIE,
    CSRF_COOKIE,
    CSRF_HEADER,
    set_auth_cookies,
    clear_auth_cookies,
    read_access_token,
)


def test_set_auth_cookies_poses_httponly_access_and_readable_csrf():
    resp = Response()
    csrf = set_auth_cookies(resp, "token-abc")

    headers = resp.raw_headers
    raw = [v.decode() for k, v in headers if k == b"set-cookie"]

    access = next(c for c in raw if c.startswith(f"{ACCESS_COOKIE}="))
    csrf_cookie = next(c for c in raw if c.startswith(f"{CSRF_COOKIE}="))

    assert "HttpOnly" in access
    assert "SameSite=lax" in access
    assert "HttpOnly" not in csrf_cookie
    assert csrf in csrf_cookie
    assert len(csrf) >= 32


def test_clear_auth_cookies_deletes_both():
    resp = Response()
    clear_auth_cookies(resp)
    raw = [v.decode() for k, v in resp.raw_headers if k == b"set-cookie"]
    assert any(ACCESS_COOKIE in c for c in raw)
    assert any(CSRF_COOKIE in c for c in raw)


def _request_with(cookies=None, headers=None):
    raw_headers = []
    if cookies:
        cookie_str = "; ".join(f"{k}={v}" for k, v in cookies.items())
        raw_headers.append((b"cookie", cookie_str.encode()))
    for k, v in (headers or {}).items():
        raw_headers.append((k.lower().encode(), v.encode()))
    scope = {
        "type": "http",
        "headers": raw_headers,
        "method": "GET",
        "path": "/",
        "query_string": b"",
    }
    return Request(scope)


def test_read_access_token_prefers_cookie():
    req = _request_with(cookies={ACCESS_COOKIE: "from-cookie"}, headers={"Authorization": "Bearer from-header"})
    assert read_access_token(req) == "from-cookie"


def test_read_access_token_falls_back_to_bearer():
    req = _request_with(cookies={}, headers={"Authorization": "Bearer from-header"})
    assert read_access_token(req) == "from-header"


def test_read_access_token_returns_none_when_missing():
    req = _request_with(cookies={}, headers={})
    assert read_access_token(req) is None


def test_read_access_token_ignores_non_bearer():
    req = _request_with(cookies={}, headers={"Authorization": "Basic xxx"})
    assert read_access_token(req) is None


def test_csrf_exempt_helper():
    from app.main import _csrf_exempt
    assert _csrf_exempt("/api/v1/auth/login")
    assert _csrf_exempt("/api/v1/auth/register")
    assert _csrf_exempt("/api/v1/auth/logout")
    assert _csrf_exempt("/api/v1/invitations/abc-123/accept")
    assert not _csrf_exempt("/api/v1/rides")
    assert not _csrf_exempt("/api/v1/invitations/abc-123")
    assert not _csrf_exempt("/api/v1/auth/me")


def test_csrf_header_constant():
    assert CSRF_HEADER == "X-CSRF-Token"
