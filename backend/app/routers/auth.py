"""
app/routers/auth.py
──────────────────────────────────────────────────────────────────────────────
Authentication endpoints.
"""

from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse

from app.core.exceptions import AuthenticationError
from app.schemas.auth import LoginRequest, LoginResponse, UserDetailResponse
from app.services.dependencies import CurrentUser, get_auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response):
    auth_service = get_auth_service()
    if auth_service is None:
        raise AuthenticationError(
            "Authentication service unavailable. Set GOOGLE_SHEETS_CREDENTIALS_JSON."
        )
    result = auth_service.login(payload.email, payload.password)
    # Also set httpOnly cookie for browser clients
    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production behind HTTPS
        max_age=60 * 60 * 8,  # 8 hours
    )
    return result


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logged out successfully."}


@router.get("/me", response_model=UserDetailResponse)
async def get_me(current_user: CurrentUser):
    auth_service = get_auth_service()
    if auth_service is None:
        # Return data from token when Sheets not configured (dev mode)
        from app.schemas.auth import UserResponse
        return UserDetailResponse(
            data=UserResponse(
                user_id=current_user.user_id,
                name="Dev User",
                email=current_user.email,
                role=current_user.role,
            )
        )
    user = auth_service.get_user_by_id(current_user.user_id)
    return UserDetailResponse(data=user)
