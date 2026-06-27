"""
app/core/config.py
──────────────────────────────────────────────────────────────────────────────
Central configuration loaded from environment variables / .env file.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    app_name: str = "ASSOCHAM AI Contact Intelligence Platform"
    app_version: str = "2.0.0"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = True

    # ── Server ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # ── Data source ───────────────────────────────────────────────────────────
    data_source: Literal["mock", "google_sheets"] = "mock"

    # ── Google Sheets ──────────────────────────────────────────────────────────
    google_sheets_spreadsheet_id: str = ""
    google_sheets_credentials_json: str = ""
    google_sheets_contacts_sheet_name: str = "Contacts"
    google_sheets_users_sheet_name: str = "Users"
    google_sheets_audit_sheet_name: str = "AuditLog"

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret: str = Field(
        default="dev-secret-change-in-production-min-32-chars!!",
        description="JWT signing secret — MUST be overridden in production",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours

    # ── Gemini AI ─────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # ── Derived helpers ───────────────────────────────────────────────────────
    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def google_sheets_configured(self) -> bool:
        import os
        has_credentials = bool(self.google_sheets_credentials_json)
        if not has_credentials:
            # Fallback to local credentials.json for backward compatibility
            has_credentials = os.path.exists("credentials.json")
        return bool(
            self.google_sheets_spreadsheet_id
            and has_credentials
        )

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
