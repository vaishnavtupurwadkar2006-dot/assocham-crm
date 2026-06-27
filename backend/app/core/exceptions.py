"""
app/core/exceptions.py
──────────────────────────────────────────────────────────────────────────────
Domain-level exceptions and FastAPI exception handlers.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ── Domain exceptions ─────────────────────────────────────────────────────────

class AppBaseException(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


class ContactNotFoundError(AppBaseException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Contact not found."


class ContactAlreadyExistsError(AppBaseException):
    status_code = status.HTTP_409_CONFLICT
    detail = "A contact with this ID or email already exists."


class DuplicateContactError(AppBaseException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Potential duplicate contact detected."


class InvalidFilterError(AppBaseException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "One or more filter values are invalid."


class DataSourceError(AppBaseException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "Data source is temporarily unavailable."


class GeminiServiceError(AppBaseException):
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "AI service is temporarily unavailable."


class AuthenticationError(AppBaseException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Invalid credentials."


class AuthorizationError(AppBaseException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "You do not have permission to perform this action."


class UserNotFoundError(AppBaseException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "User not found."


class UserAlreadyExistsError(AppBaseException):
    status_code = status.HTTP_409_CONFLICT
    detail = "A user with this email already exists."


# ── Exception handlers ────────────────────────────────────────────────────────

def _error_response(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": detail, "data": None},
    )


async def app_exception_handler(request: Request, exc: AppBaseException) -> JSONResponse:
    return _error_response(exc.status_code, exc.detail)


async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return _error_response(status.HTTP_404_NOT_FOUND, "Resource not found.")


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "An internal server error occurred.",
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppBaseException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(404, not_found_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)  # type: ignore[arg-type]
