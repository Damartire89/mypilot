from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, drivers, rides, settings, vehicles
from app.config import settings as app_settings

app = FastAPI(title="myPilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(rides.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "app": "myPilot"}
