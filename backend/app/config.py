import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 1440
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173,http://localhost:4173,http://localhost:4174,http://localhost:5174"

    model_config = {"env_file": ".env"}

    def get_allowed_origins(self) -> List[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        if not origins:
            raise ValueError("ALLOWED_ORIGINS ne peut pas être vide")
        if self.environment == "production":
            bad = [o for o in origins if "localhost" in o or "127.0.0.1" in o]
            if bad:
                raise ValueError(f"ALLOWED_ORIGINS contient des origines locales en prod: {bad}")
        return origins

    def validate_production(self) -> None:
        if self.environment != "production":
            return
        sk = self.secret_key or ""
        if len(sk) < 32 or "dev" in sk.lower() or "change" in sk.lower():
            raise ValueError(
                "SECRET_KEY faible en production — générez une clé aléatoire de 32+ caractères "
                "(openssl rand -hex 32)"
            )


settings = Settings()
settings.validate_production()
