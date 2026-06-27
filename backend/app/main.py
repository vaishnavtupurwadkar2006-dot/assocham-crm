"""
app/main.py
──────────────────────────────────────────────────────────────────────────────
ASSOCHAM AI Contact Intelligence Platform — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger
from app.routers import ai_search, auth, business_card, contacts, dashboard, users

logger = get_logger(__name__)
settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-powered CRM for ASSOCHAM contact management with Gemini Vision business card extraction.",
        docs_url="/api/docs" if settings.is_development else None,
        redoc_url="/api/redoc" if settings.is_development else None,
        openapi_url="/api/openapi.json" if settings.is_development else None,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    API_PREFIX = "/api/v1"
    app.include_router(auth.router, prefix=API_PREFIX)
    app.include_router(contacts.router, prefix=API_PREFIX)
    app.include_router(business_card.router, prefix=API_PREFIX)
    app.include_router(dashboard.router, prefix=API_PREFIX)
    app.include_router(ai_search.router, prefix=API_PREFIX)
    app.include_router(users.router, prefix=API_PREFIX)

    # ── Health & root ─────────────────────────────────────────────────────────
    @app.get("/")
    async def root():
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "environment": settings.environment,
            "data_source": settings.data_source,
            "docs": "/api/docs",
        }

    @app.get("/api/v1/health")
    async def health():
        return {
            "status": "healthy",
            "data_source": settings.data_source,
            "google_sheets_configured": settings.google_sheets_configured,
            "gemini_configured": settings.gemini_configured,
        }

    logger.info(
        "App started | env=%s | data_source=%s | sheets=%s | gemini=%s",
        settings.environment,
        settings.data_source,
        settings.google_sheets_configured,
        settings.gemini_configured,
    )
    return app


app = create_app()
