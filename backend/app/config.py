from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 1440
    # ALLOWED_ORIGINS: liste d'URLs séparées par des virgules
    # Ex: "https://mypilot.up.railway.app,http://localhost:5173"
    allowed_origins: str = "http://localhost:5173,http://localhost:4173,http://localhost:4174,http://localhost:5174"

    model_config = {"env_file": ".env"}

    def get_allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
