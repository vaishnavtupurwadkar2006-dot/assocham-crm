"""
app/services/gemini_service.py
──────────────────────────────────────────────────────────────────────────────
Gemini AI service:
  1. Business card extraction via Gemini Vision
  2. Natural language search query parsing (dynamic sectors/states)
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import GeminiServiceError
from app.core.logging import get_logger
from app.schemas.business_card import ExtractedFields

logger = get_logger(__name__)


def _get_client():
    """Lazy-initialise Gemini client."""
    try:
        import google.generativeai as genai
        settings = get_settings()
        if not settings.gemini_api_key:
            raise GeminiServiceError("GEMINI_API_KEY is not configured.")
        genai.configure(api_key=settings.gemini_api_key)
        return genai
    except ImportError as exc:
        raise GeminiServiceError("google-generativeai package is not installed.") from exc


# ── Business Card Extraction ──────────────────────────────────────────────────

APPROVED_SECTOR_LIST = (
    "Agriculture, Banking & Finance, Biotechnology, Consulting, Education, Energy, "
    "Engineering, Food & Beverage, Government, Handicrafts, Healthcare, "
    "Hospitality & Tourism, Information Technology, Legal, Logistics & Supply Chain, "
    "Manufacturing, Media & Communications, NGO / Non-Profit, Pharmaceuticals, "
    "Real Estate, Renewable Energy, Sustainability, Other"
)

EXTRACTION_PROMPT = f"""You are an expert at reading business cards.

Extract ALL contact information visible on this business card and return it as a JSON object.
Return ONLY valid JSON — no markdown, no code fences, no explanation.

Extract these fields (use null for any field not visible):
{{
  "name": "Full name of the person",
  "designation": "Job title or designation",
  "company": "Company or organization name",
  "parent_organization": "Parent company or group name if mentioned",
  "phone": "Primary phone number with country code",
  "alternate_phone": "Secondary phone number if present",
  "email": "Primary email address",
  "alternate_email": "Secondary email address if present",
  "website": "Website URL",
  "linkedin": "LinkedIn profile URL or handle",
  "address": "Full address",
  "city": "City name",
  "state": "State or province name",
  "country": "Country name (default India if not mentioned)",
  "sector": "Choose EXACTLY ONE sector from this approved list: {APPROVED_SECTOR_LIST}. Pick the single best match based on the company name and job title. Return only the exact string from the list. If nothing matches well, return Other. Never invent a new sector name.",
  "notes": "Any other relevant information on the card"
}}

Important rules:
- Extract phone numbers as plain text with + country code if visible
- Extract email addresses exactly as shown
- If the company name contains a division, use the full name as company
- For the sector field: ONLY return one of the approved values listed above — do not create new categories
- If multiple addresses, use the primary one
- Return valid JSON only"""


def extract_business_card(image_base64: str, mime_type: str = "image/jpeg") -> tuple[ExtractedFields, str, float]:
    """
    Extract contact fields from a business card image.

    Returns:
        (ExtractedFields, raw_json_string, confidence_score)
    """
    genai = _get_client()
    settings = get_settings()

    try:
        model = genai.GenerativeModel(settings.gemini_model)
        image_part = {"mime_type": mime_type, "data": image_base64}
        response = model.generate_content([EXTRACTION_PROMPT, image_part])
        raw_text = response.text.strip()
    except Exception as exc:
        logger.error("Gemini Vision extraction failed: %s", exc)
        raise GeminiServiceError(f"Business card extraction failed: {exc}") from exc

    # Strip markdown fences if Gemini adds them despite the prompt
    clean_text = re.sub(r"```(?:json)?\s*", "", raw_text).replace("```", "").strip()

    try:
        data: dict[str, Any] = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned non-JSON, attempting partial parse: %s", exc)
        data = _emergency_parse(clean_text)

    raw_json = json.dumps(data, ensure_ascii=False, indent=2)

    # Map to ExtractedFields
    fields = ExtractedFields(
        name=_str(data.get("name")),
        designation=_str(data.get("designation")),
        company=_str(data.get("company")),
        parent_organization=_str(data.get("parent_organization")),
        phone=_str(data.get("phone")),
        alternate_phone=_str(data.get("alternate_phone")),
        email=_str(data.get("email")),
        alternate_email=_str(data.get("alternate_email")),
        website=_str(data.get("website")),
        linkedin=_str(data.get("linkedin")),
        address=_str(data.get("address")),
        city=_str(data.get("city")),
        state=_str(data.get("state")),
        country=_str(data.get("country")) or "India",
        sector=_str(data.get("sector")),
        notes=_str(data.get("notes")),
    )

    confidence = _calculate_confidence(fields)
    logger.info("Extraction complete | name=%s | company=%s | confidence=%.2f", fields.name, fields.company, confidence)
    return fields, raw_json, confidence


def _str(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s and s.lower() != "null" else None


def _calculate_confidence(fields: ExtractedFields) -> float:
    """Score 0–1 based on how many key fields were extracted."""
    key_fields = ["name", "company", "email", "phone", "designation"]
    optional_fields = ["website", "linkedin", "address", "city", "state", "sector"]
    score = 0.0
    for f in key_fields:
        if getattr(fields, f):
            score += 0.15
    for f in optional_fields:
        if getattr(fields, f):
            score += 0.05
    return min(round(score, 2), 1.0)


def _emergency_parse(text: str) -> dict[str, Any]:
    """Best-effort key-value extraction when JSON parse fails."""
    result: dict[str, Any] = {}
    patterns = [
        ("name", r'"name"\s*:\s*"([^"]+)"'),
        ("company", r'"company"\s*:\s*"([^"]+)"'),
        ("email", r'"email"\s*:\s*"([^"]+)"'),
        ("phone", r'"phone"\s*:\s*"([^"]+)"'),
        ("designation", r'"designation"\s*:\s*"([^"]+)"'),
    ]
    for key, pattern in patterns:
        m = re.search(pattern, text)
        if m:
            result[key] = m.group(1)
    return result


# ── AI Search Query Parsing ───────────────────────────────────────────────────

def parse_search_query(
    query: str,
    available_sectors: list[str],
    available_states: list[str],
    available_designations: list[str],
) -> dict[str, Any]:
    """
    Parse a natural language search query into structured filters.
    Uses DYNAMIC sector/state lists from live database — no hardcoding.
    """
    genai = _get_client()
    settings = get_settings()

    sectors_str = ", ".join(f'"{s}"' for s in available_sectors) if available_sectors else "any sector"
    states_str = ", ".join(f'"{s}"' for s in available_states) if available_states else "any state"
    designations_str = ", ".join(f'"{d}"' for d in available_designations[:30]) if available_designations else "any designation"

    system_prompt = f"""You are a CRM search assistant for ASSOCHAM (Associated Chambers of Commerce and Industry of India).

Parse the user's search query into structured filters. Return ONLY valid JSON.

AVAILABLE SECTORS in the database: [{sectors_str}]
AVAILABLE STATES in the database: [{states_str}]
AVAILABLE DESIGNATIONS (sample): [{designations_str}]

Return this exact JSON structure:
{{
  "search": "keyword search string or null",
  "sector": "exact sector name from available list or null",
  "state": "exact state name from available list or null",
  "city": "city name or null",
  "priority": "High or Medium or Low or null",
  "status": "Active or Inactive or Pending or Archived or null",
  "designation_keyword": "keyword to match designation or null",
  "company_keyword": "keyword to match company name or null",
  "explanation": "One sentence explaining what this search will return"
}}

Rules:
- ONLY use sector values from the AVAILABLE SECTORS list above
- ONLY use state values from the AVAILABLE STATES list above
- Match sector/state by semantic similarity (e.g. "healthcare" → find closest match in list)
- If no close match exists, set the field to null
- For designation keywords like "CEO", "Director", "Manager" — put in designation_keyword
- For company-specific searches — put keyword in company_keyword
- Keep explanation concise and user-friendly"""

    try:
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content([system_prompt, f"Search query: {query}"])
        raw = response.text.strip()
    except Exception as exc:
        logger.warning("Gemini search parse failed, using keyword fallback: %s", exc)
        return _keyword_fallback(query)

    clean = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        logger.warning("Gemini returned non-JSON for search query, using fallback")
        return _keyword_fallback(query)


def _keyword_fallback(query: str) -> dict[str, Any]:
    return {
        "search": query,
        "sector": None,
        "state": None,
        "city": None,
        "priority": None,
        "status": None,
        "designation_keyword": None,
        "company_keyword": None,
        "explanation": f"Showing contacts matching '{query}'",
    }


def generate_search_suggestions(
    available_sectors: list[str],
    available_states: list[str],
) -> list[str]:
    """Generate contextual search suggestions from live data."""
    suggestions = []
    for sector in available_sectors[:3]:
        suggestions.append(f"Find {sector} contacts")
    for state in available_states[:3]:
        suggestions.append(f"Show contacts from {state}")
    suggestions.extend([
        "Find high priority contacts",
        "Show CEOs and Managing Directors",
        "Contacts added this month",
        "Contacts missing email address",
        "Show contacts with follow-ups due",
    ])
    return suggestions[:10]
