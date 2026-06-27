"""
app/services/dependencies.py
──────────────────────────────────────────────────────────────────────────────
FastAPI dependency injection: repositories, services, JWT auth guards.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Any

from fastapi import Cookie, Depends, Header
from fastapi.security import OAuth2PasswordBearer

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.logging import get_logger
from app.core.security import decode_access_token
from app.schemas.auth import TokenData, UserRole
from app.services.audit_repository import AuditRepository
from app.services.auth_service import AuthService
from app.services.base_repository import AbstractContactRepository
from app.services.contact_service import ContactService
from app.services.dashboard_service import DashboardService
from app.services.users_repository import UsersRepository

logger = get_logger(__name__)
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# ── Repository factory ────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_contact_repository() -> AbstractContactRepository:
    settings = get_settings()
    if settings.data_source == "google_sheets":
        if not settings.google_sheets_configured:
            logger.warning("Google Sheets not configured, falling back to mock")
            from app.services.mock_repository import MockContactRepository
            return MockContactRepository()
        from app.services.google_sheets_repository import GoogleSheetsRepository
        return GoogleSheetsRepository(
            spreadsheet_id=settings.google_sheets_spreadsheet_id,
            credentials_json=settings.google_sheets_credentials_json or "credentials.json",
            sheet_name=settings.google_sheets_contacts_sheet_name,
        )
    from app.services.mock_repository import MockContactRepository
    return MockContactRepository()


@lru_cache(maxsize=1)
def get_users_repository() -> Any:
    settings = get_settings()
    if settings.data_source == "google_sheets" and settings.google_sheets_configured:
        from app.services.users_repository import UsersRepository
        return UsersRepository(
            spreadsheet_id=settings.google_sheets_spreadsheet_id,
            credentials_json=settings.google_sheets_credentials_json or "credentials.json",
            sheet_name=settings.google_sheets_users_sheet_name,
        )
    from app.services.mock_repository import MockUsersRepository
    return MockUsersRepository()


@lru_cache(maxsize=1)
def get_audit_repository() -> AuditRepository | None:
    settings = get_settings()
    if not settings.google_sheets_configured:
        return None
    return AuditRepository(
        spreadsheet_id=settings.google_sheets_spreadsheet_id,
        credentials_json=settings.google_sheets_credentials_json or "credentials.json",
        sheet_name=settings.google_sheets_audit_sheet_name,
    )


# ── Service factories ─────────────────────────────────────────────────────────

def get_contact_service(
    repo: AbstractContactRepository = Depends(get_contact_repository),
) -> ContactService:
    return ContactService(repo)


def get_dashboard_service(
    repo: AbstractContactRepository = Depends(get_contact_repository),
) -> DashboardService:
    return DashboardService(repo)


def get_auth_service() -> AuthService | None:
    users_repo = get_users_repository()
    if users_repo is None:
        return None
    return AuthService(users_repo)


# ── JWT Auth ──────────────────────────────────────────────────────────────────

def _extract_token(
    bearer: str | None,
    cookie: str | None,
    header: str | None,
) -> str | None:
    """Extract JWT from Bearer header, cookie, or raw Authorization header."""
    if bearer:
        return bearer
    if cookie:
        return cookie
    if header and header.startswith("Bearer "):
        return header[7:]
    return None


def get_current_user(
    bearer_token: str | None = Depends(_oauth2_scheme),
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
) -> TokenData:
    token = _extract_token(bearer_token, access_token, authorization)
    if not token:
        raise AuthenticationError("Authentication required. Please log in.")

    payload = decode_access_token(token)
    if not payload:
        raise AuthenticationError("Invalid or expired token. Please log in again.")

    return TokenData(
        user_id=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "Intern"),
    )


def require_role(*roles: UserRole):
    """Dependency factory: require the current user to have one of the specified roles."""
    def _check(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role not in roles:
            raise AuthorizationError(
                f"This action requires one of these roles: {', '.join(roles)}. "
                f"Your role: {current_user.role}"
            )
        return current_user
    return _check


# ── Type aliases for cleaner router signatures ────────────────────────────────

CurrentUser = Annotated[TokenData, Depends(get_current_user)]
AdminOnly = Annotated[TokenData, Depends(require_role("Admin"))]
StaffOrAbove = Annotated[TokenData, Depends(require_role("Admin", "Staff"))]
