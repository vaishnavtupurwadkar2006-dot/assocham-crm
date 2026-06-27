"""
app/schemas/business_card.py
──────────────────────────────────────────────────────────────────────────────
Request/response models for business card extraction endpoints.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class ExtractionRequest(BaseModel):
    """Single business card extraction request."""
    image_base64: str = Field(..., description="Base64-encoded image data")
    mime_type: str = Field(
        default="image/jpeg",
        description="MIME type: image/jpeg, image/png, image/webp, image/heic",
    )
    event_source: Optional[str] = Field(
        None, description="Event where the card was collected"
    )


class ExtractedFields(BaseModel):
    """Fields extracted from a business card by Gemini Vision."""
    name: Optional[str] = None
    designation: Optional[str] = None
    company: Optional[str] = None
    parent_organization: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[str] = None
    alternate_email: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    sector: Optional[str] = None
    notes: Optional[str] = None


class ExtractionResponse(BaseModel):
    """Response from single card extraction."""
    success: bool = True
    data: ExtractedFields
    raw_extraction_json: str = Field(
        ..., description="Raw JSON string from Gemini for audit purposes"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Extraction confidence score 0-1",
    )
    extraction_notes: Optional[str] = Field(
        None, description="Any warnings or notes from the extraction"
    )


class BulkExtractionItem(BaseModel):
    """Single item in a bulk extraction batch."""
    image_base64: str
    mime_type: str = "image/jpeg"
    card_index: int


class BulkExtractionRequest(BaseModel):
    """Bulk business card extraction request."""
    cards: list[BulkExtractionItem]
    event_source: Optional[str] = None


class BulkExtractionResult(BaseModel):
    """Result for one card in a bulk batch."""
    card_index: int
    success: bool
    extracted: Optional[ExtractedFields] = None
    raw_extraction_json: Optional[str] = None
    error: Optional[str] = None


class BulkExtractionResponse(BaseModel):
    """Response from bulk extraction."""
    success: bool = True
    data: list[BulkExtractionResult]
    total: int
    succeeded: int
    failed: int


class ConfirmExtractionRequest(BaseModel):
    """
    User-reviewed and confirmed contact data from a business card extraction.
    Sent after the user reviews and edits the pre-filled form.
    """
    # All fields from the extraction, potentially edited by user
    Name: Optional[str] = None
    Designation: Optional[str] = None
    Company: str
    Parent_Organization: Optional[str] = None
    Sector: Optional[str] = None
    Company_Type: Optional[str] = None
    Phone: Optional[str] = None
    Alternate_Phone: Optional[str] = None
    Email: Optional[str] = None
    Alternate_Email: Optional[str] = None
    Website: Optional[str] = None
    LinkedIn: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    State: Optional[str] = None
    Country: Optional[str] = "India"
    Contact_Priority: str = "Medium"
    Event_Source: Optional[str] = None
    Notes: Optional[str] = None
    Next_Followup_Date: Optional[str] = None
    # Stored for audit
    Raw_Extraction_JSON: Optional[str] = None
    # Duplicate handling
    force_create: bool = Field(
        False,
        description="If True, create even if a duplicate is detected",
    )
    merge_with_id: Optional[str] = Field(
        None,
        description="If set, merge with this existing contact ID",
    )
