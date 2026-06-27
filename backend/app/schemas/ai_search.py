"""
app/schemas/ai_search.py
──────────────────────────────────────────────────────────────────────────────
Request and response models for AI search endpoints.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.contact import ContactResponse


class AISearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)


class AISearchMeta(BaseModel):
    used_gemini: bool
    parsed_filters: dict
    total_results: int
    explanation: str
    available_sectors: list[str] = []
    available_states: list[str] = []


class AISearchResponse(BaseModel):
    success: bool = True
    data: list[ContactResponse]
    meta: AISearchMeta


class SuggestionsResponse(BaseModel):
    success: bool = True
    data: list[str]
