from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter
from app.api.v1 import auth, drivers, rides, settings, vehicles, members, invitations, admin, gasoil
from app.config import settings as app_settings
from app.cookies import CSRF_COOKIE, CSRF_HEADER

app = FastAPI(title="myPilot API", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/logout",
}
CSRF_EXEMPT_PREFIXES = ("/api/v1/invitations/",)
CSRF_METHODS = {"POST", "PATCH", "PUT", "DELETE"}


def _csrf_exempt(path: str) -> bool:
    if path in CSRF_EXEMPT_PATHS:
        return True
    if path.endswith("/accept") and any(path.startswith(p) for p in CSRF_EXEMPT_PREFIXES):
        return True
    return False


@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if request.method in CSRF_METHODS and not _csrf_exempt(request.url.path):
        if request.cookies.get(CSRF_COOKIE):
            sent = request.headers.get(CSRF_HEADER)
            if not sent or sent != request.cookies.get(CSRF_COOKIE):
                return JSONResponse(status_code=403, content={"detail": "CSRF token invalide"})
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if app_settings.environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", CSRF_HEADER],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(rides.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(members.router, prefix="/api/v1")
app.include_router(invitations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(gasoil.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "app": "myPilot"}


@app.get("/health/db")
def health_db():
    """Vérifie que la BDD répond. Utile pour monitoring + keep-alive."""
    from app.database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "reachable"}
    except Exception as e:
        return {"status": "degraded", "db": "unreachable", "error": str(e)[:100]}
    finally:
        db.close()
