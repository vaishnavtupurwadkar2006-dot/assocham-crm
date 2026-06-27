"""
app/schemas/auth.py
──────────────────────────────────────────────────────────────────────────────
Pydantic models for authentication.
"""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field

UserRole = Literal["Admin", "Staff", "Intern"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: UserRole
    department: Optional[str] = None
    status: str = "Active"

    model_config = {"populate_by_name": True}


class LoginResponse(BaseModel):
    success: bool = True
    data: UserResponse
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole


class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = "Staff"
    department: Optional[str] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


class UserListResponse(BaseModel):
    success: bool = True
    data: list[UserResponse]


class UserDetailResponse(BaseModel):
    success: bool = True
    data: UserResponse
