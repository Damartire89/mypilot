"""Helpers pour poser/lire les cookies d'authentification.

Stratégie : JWT dans cookie HttpOnly (inaccessible JS → anti-XSS).
CSRF double-submit : token dans cookie non-HttpOnly + header `X-CSRF-Token`.
"""
import secrets
from fastapi import Response, Request
from app.config import settings

ACCESS_COOKIE = "mypilot_access"
CSRF_COOKIE = "mypilot_csrf"
CSRF_HEADER = "X-CSRF-Token"


def _is_secure_request(request: Request | None) -> bool:
    """Détecte HTTPS, en tenant compte du reverse proxy (X-Forwarded-Proto)."""
    if request is None:
        return False
    if request.url.scheme == "https":
        return True
    if request.headers.get("x-forwarded-proto", "").lower() == "https":
        return True
    return False


def _cookie_params(request: Request | None = None) -> dict:
    secure = _is_secure_request(request) or settings.environment == "production"
    return {
        "secure": secure,
        "samesite": "none" if secure else "lax",
        "path": "/",
        "max_age": settings.access_token_expire_minutes * 60,
    }


def set_auth_cookies(response: Response, token: str, request: Request | None = None) -> str:
    """Pose access token (HttpOnly) + CSRF token (lisible JS). Retourne le CSRF."""
    params = _cookie_params(request)
    response.set_cookie(ACCESS_COOKIE, token, httponly=True, **params)
    csrf = secrets.token_urlsafe(32)
    response.set_cookie(CSRF_COOKIE, csrf, httponly=False, **params)
    return csrf


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


def read_access_token(request: Request) -> str | None:
    """Lit le token depuis cookie, fallback sur header Authorization."""
    cookie = request.cookies.get(ACCESS_COOKIE)
    if cookie:
        return cookie
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None
