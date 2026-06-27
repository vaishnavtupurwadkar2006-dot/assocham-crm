"""
app/services/auth_service.py
──────────────────────────────────────────────────────────────────────────────
Authentication business logic.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import AuthenticationError, UserNotFoundError
from app.core.logging import get_logger
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import (
    LoginResponse,
    TokenData,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.services.users_repository import UsersRepository

logger = get_logger(__name__)


class AuthService:
    def __init__(self, users_repo: UsersRepository) -> None:
        self._repo = users_repo

    def login(self, email: str, password: str) -> LoginResponse:
        user = self._repo.get_by_email(email)
        if not user:
            raise AuthenticationError("Invalid email or password.")

        if user.get("Status", "Active") != "Active":
            raise AuthenticationError("This account has been deactivated.")

        stored_hash = user.get("Password_Hash", "")
        if not stored_hash or not verify_password(password, stored_hash):
            raise AuthenticationError("Invalid email or password.")

        token_data = {
            "sub": user["User_ID"],
            "email": user["Email"],
            "role": user["Role"],
        }
        token = create_access_token(token_data)

        # Update Last_Login
        try:
            self._repo.update(user["User_ID"], {
                "Last_Login": datetime.now(timezone.utc).isoformat()
            })
        except Exception:
            pass  # non-fatal

        user_response = self._to_response(user)
        logger.info("Login: %s | role=%s", email, user["Role"])
        return LoginResponse(data=user_response, access_token=token)

    def get_user_by_id(self, user_id: str) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User '{user_id}' not found.")
        return self._to_response(user)

    def list_users(self) -> list[UserResponse]:
        return [self._to_response(u) for u in self._repo.get_all()]

    def create_user(self, payload: UserCreateRequest) -> UserResponse:
        user_id = self._repo.next_id()
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "User_ID": user_id,
            "Name": payload.name,
            "Email": payload.email,
            "Password_Hash": hash_password(payload.password),
            "Role": payload.role,
            "Department": payload.department or "",
            "Status": "Active",
            "Created_At": now,
            "Last_Login": "",
        }
        self._repo.create(record)
        logger.info("User created: %s | role=%s", payload.email, payload.role)
        return self._to_response(record)

    def update_user(self, user_id: str, payload: UserUpdateRequest) -> UserResponse:
        updates: dict[str, Any] = {}
        if payload.name is not None:
            updates["Name"] = payload.name
        if payload.role is not None:
            updates["Role"] = payload.role
        if payload.department is not None:
            updates["Department"] = payload.department
        if payload.status is not None:
            updates["Status"] = payload.status
        if payload.password is not None:
            updates["Password_Hash"] = hash_password(payload.password)

        updated = self._repo.update(user_id, updates)
        return self._to_response(updated)

    @staticmethod
    def _to_response(user: dict[str, Any]) -> UserResponse:
        return UserResponse(
            user_id=user["User_ID"],
            name=user.get("Name", ""),
            email=user.get("Email", ""),
            role=user.get("Role", "Staff"),
            department=user.get("Department") or None,
            status=user.get("Status", "Active"),
        )
