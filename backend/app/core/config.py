from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from typing import Optional


class Settings(BaseSettings):
    database_url: Optional[str] = None
    sms_provider: str = "development"
    environment: str = "development"
    frontend_origins: str = "http://127.0.0.1:3000,http://localhost:3000"
    frontend_url: str = "http://127.0.0.1:3000"
    session_secret: Optional[str] = None
    better_auth_secret: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def effective_session_secret(self) -> str:
        return self.session_secret or self.better_auth_secret or "sm1-local-development-session-secret"


@lru_cache
def get_settings() -> Settings:
    return Settings()
