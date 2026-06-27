"""
app/routers/ai_search.py
──────────────────────────────────────────────────────────────────────────────
AI-powered natural language search — fixed to use dynamic sector/state values
from live Google Sheets data (no hardcoded lists).
"""

from fastapi import APIRouter, Depends

from app.core.logging import get_logger
from app.schemas.ai_search import AISearchMeta, AISearchRequest, AISearchResponse, SuggestionsResponse
from app.services import gemini_service
from app.services.contact_service import ContactService
from app.services.dependencies import CurrentUser, get_contact_service

logger = get_logger(__name__)
router = APIRouter(prefix="/ai-search", tags=["AI Search"])


@router.post("", response_model=AISearchResponse)
async def ai_search(
    payload: AISearchRequest,
    current_user: CurrentUser,
    svc: ContactService = Depends(get_contact_service),
):
    # Pull live values from actual database — no hardcoding
    available_sectors = svc.get_distinct_values("Sector")
    available_states = svc.get_distinct_values("State")
    available_designations = svc.get_distinct_values("Designation")

    logger.info(
        "AI Search | query=%r | sectors=%d | states=%d | user=%s",
        payload.query, len(available_sectors), len(available_states), current_user.email,
    )

    # Parse with Gemini using live values
    parsed = gemini_service.parse_search_query(
        query=payload.query,
        available_sectors=available_sectors,
        available_states=available_states,
        available_designations=available_designations,
    )

    used_gemini = parsed.get("explanation") is not None and "matching" not in parsed.get("explanation", "")

    # Apply parsed filters
    results = svc.search_contacts(parsed)

    explanation = parsed.get("explanation") or f"Showing {len(results)} contacts matching your search."

    return AISearchResponse(
        data=results,
        meta=AISearchMeta(
            used_gemini=used_gemini,
            parsed_filters=parsed,
            total_results=len(results),
            explanation=explanation,
            available_sectors=available_sectors,
            available_states=available_states,
        ),
    )


@router.get("/suggestions", response_model=SuggestionsResponse)
async def get_suggestions(
    current_user: CurrentUser,
    svc: ContactService = Depends(get_contact_service),
):
    """Return dynamic search suggestions based on live data."""
    available_sectors = svc.get_distinct_values("Sector")
    available_states = svc.get_distinct_values("State")
    suggestions = gemini_service.generate_search_suggestions(available_sectors, available_states)
    return SuggestionsResponse(data=suggestions)
