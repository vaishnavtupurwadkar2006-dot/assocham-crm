"""
app/routers/users.py
──────────────────────────────────────────────────────────────────────────────
User management endpoints — Admin only.
"""

from fastapi import APIRouter

from app.core.exceptions import DataSourceError
from app.schemas.auth import (
    UserCreateRequest,
    UserDetailResponse,
    UserListResponse,
    UserUpdateRequest,
)
from app.services.auth_service import AuthService
from app.services.dependencies import AdminOnly, get_auth_service

router = APIRouter(prefix="/users", tags=["User Management"])


def _get_svc() -> AuthService:
    svc = get_auth_service()
    if svc is None:
        raise DataSourceError("User management requires Google Sheets to be configured.")
    return svc


@router.get("", response_model=UserListResponse)
async def list_users(current_user: AdminOnly):
    return UserListResponse(data=_get_svc().list_users())


@router.post("", response_model=UserDetailResponse, status_code=201)
async def create_user(payload: UserCreateRequest, current_user: AdminOnly):
    user = _get_svc().create_user(payload)
    return UserDetailResponse(data=user)


@router.put("/{user_id}", response_model=UserDetailResponse)
async def update_user(user_id: str, payload: UserUpdateRequest, current_user: AdminOnly):
    user = _get_svc().update_user(user_id, payload)
    return UserDetailResponse(data=user)


@router.delete("/{user_id}")
async def deactivate_user(user_id: str, current_user: AdminOnly):
    _get_svc().update_user(user_id, UserUpdateRequest(status="Inactive"))
    return {"success": True, "message": f"User {user_id} deactivated."}
