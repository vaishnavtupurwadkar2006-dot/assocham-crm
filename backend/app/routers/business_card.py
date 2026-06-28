"""
app/routers/business_card.py
──────────────────────────────────────────────────────────────────────────────
Business card intelligence endpoints — the flagship feature.

Flow:
  POST /extract   → Gemini Vision → ExtractedFields
  POST /confirm   → User-reviewed fields → Save to Google Sheets
  POST /bulk      → Batch extraction
"""

from __future__ import annotations

import asyncio
from datetime import date

from fastapi import APIRouter

from app.core.exceptions import GeminiServiceError
from app.core.logging import get_logger
from app.schemas.business_card import (
    BulkExtractionRequest,
    BulkExtractionResponse,
    BulkExtractionResult,
    ConfirmExtractionRequest,
    ExtractionRequest,
    ExtractionResponse,
)
from app.schemas.contact import ContactDetailResponse, ContactResponse
from app.services import gemini_service
from app.services.contact_service import ContactService
from app.services.dependencies import (
    CurrentUser,
    StaffOrAbove,
    get_audit_repository,
    get_contact_service,
)
from fastapi import Depends

logger = get_logger(__name__)
router = APIRouter(prefix="/business-card", tags=["Business Card Intelligence"])


@router.post("/extract", response_model=ExtractionResponse)
async def extract_single_card(
    payload: ExtractionRequest,
    current_user: StaffOrAbove,
):
    """
    Step 1: Upload a business card image → Gemini Vision extracts contact fields.
    Returns pre-filled fields for user review. Nothing is saved to the database yet.
    """
    logger.info("Business card extraction request | user=%s", current_user.email)

    fields, raw_json, confidence = gemini_service.extract_business_card(
        image_base64=payload.image_base64,
        mime_type=payload.mime_type,
    )

    # If event_source was provided in the request, add it to notes context
    notes = None
    if payload.event_source:
        notes = f"Collected at: {payload.event_source}"

    return ExtractionResponse(
        data=fields,
        raw_extraction_json=raw_json,
        confidence=confidence,
        extraction_notes=notes,
    )


@router.post("/confirm", response_model=ContactDetailResponse)
async def confirm_and_save(
    payload: ConfirmExtractionRequest,
    current_user: StaffOrAbove,
    svc: ContactService = Depends(get_contact_service),
):
    """
    Step 2: User has reviewed the extracted fields (and optionally edited them).
    Saves the contact to Google Sheets.

    Supports:
    - force_create=True: save even if duplicate detected
    - merge_with_id: merge fields into an existing contact
    """
    audit_repo = get_audit_repository()

    # Handle merge
    if payload.merge_with_id:
        updates = _payload_to_dict(payload)
        updates.pop("Contact_ID", None)
        contact = svc.update_contact(
            contact_id=payload.merge_with_id,
            updates=updates,
            user_id=current_user.user_id,
            user_name=current_user.email,
            audit_repo=audit_repo,
        )
        logger.info("Business card merged into contact: %s", payload.merge_with_id)
        return ContactDetailResponse(data=contact)

    # Check for duplicates unless forced
    if not payload.force_create:
        dup_result = svc.check_duplicate(
            email=payload.Email,
            phone=payload.Phone,
            name=payload.Name,
            company=payload.Company,
        )
        if dup_result.is_duplicate:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=409,
                content={
                    "success": False,
                    "error": "Duplicate contact detected",
                    "duplicate": {
                        "is_duplicate": True,
                        "confidence": dup_result.confidence,
                        "match_reason": dup_result.match_reason,
                        "existing_contact": dup_result.existing_contact.model_dump() if dup_result.existing_contact else None,
                    },
                },
            )

    # Build contact payload
    from app.schemas.contact import ContactCreate
    create_data = ContactCreate(
        Name=payload.Name,
        Designation=payload.Designation,
        Company=payload.Company,
        Parent_Organization=payload.Parent_Organization,
        Sector=payload.Sector,
        Company_Type=None,
        Phone=payload.Phone,
        Alternate_Phone=payload.Alternate_Phone,
        Email=payload.Email,
        Alternate_Email=payload.Alternate_Email,
        Website=payload.Website,
        LinkedIn=payload.LinkedIn,
        Address=payload.Address,
        City=payload.City,
        State=payload.State,
        Country=payload.Country or "India",
        Contact_Priority=payload.Contact_Priority,
        Status="Active",
        Event_Source=payload.Event_Source,
        Source_Type="Business Card",
        Import_Source=payload.Event_Source or "Business Card Import",
        Notes=payload.Notes,
        Next_Followup_Date=payload.Next_Followup_Date if payload.Next_Followup_Date else None,
        Raw_Extraction_JSON=payload.Raw_Extraction_JSON,
    )

    contact = svc.create_contact(
        payload=create_data,
        user_id=current_user.user_id,
        user_name=current_user.email,
        audit_repo=audit_repo,
    )

    logger.info("Business card saved as contact: %s | user=%s", contact.Contact_ID, current_user.email)
    return ContactDetailResponse(data=contact)


@router.post("/bulk-extract", response_model=BulkExtractionResponse)
async def bulk_extract(
    payload: BulkExtractionRequest,
    current_user: StaffOrAbove,
):
    """
    Batch business card extraction. Processes up to 100 cards.
    Each card is extracted independently — failures don't block others.
    """
    logger.info("Bulk extraction request | cards=%d | user=%s", len(payload.cards), current_user.email)

    results: list[BulkExtractionResult] = []
    succeeded = 0
    failed = 0

    # Process cards sequentially to respect Gemini rate limits
    for card in payload.cards:
        try:
            fields, raw_json, confidence = gemini_service.extract_business_card(
                image_base64=card.image_base64,
                mime_type=card.mime_type,
            )
            results.append(BulkExtractionResult(
                card_index=card.card_index,
                success=True,
                extracted=fields,
                raw_extraction_json=raw_json,
            ))
            succeeded += 1
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)
        except Exception as exc:
            logger.warning("Card %d extraction failed: %s", card.card_index, exc)
            results.append(BulkExtractionResult(
                card_index=card.card_index,
                success=False,
                error=str(exc),
            ))
            failed += 1

    return BulkExtractionResponse(
        data=results,
        total=len(payload.cards),
        succeeded=succeeded,
        failed=failed,
    )


def _payload_to_dict(payload: ConfirmExtractionRequest) -> dict:
    return {
        "Name": payload.Name,
        "Designation": payload.Designation,
        "Company": payload.Company,
        "Parent_Organization": payload.Parent_Organization,
        "Sector": payload.Sector,
        "Phone": payload.Phone,
        "Alternate_Phone": payload.Alternate_Phone,
        "Email": payload.Email,
        "Alternate_Email": payload.Alternate_Email,
        "Website": payload.Website,
        "LinkedIn": payload.LinkedIn,
        "Address": payload.Address,
        "City": payload.City,
        "State": payload.State,
        "Country": payload.Country,
        "Contact_Priority": payload.Contact_Priority,
        "Event_Source": payload.Event_Source,
        "Source_Type": "Business Card",
        "Import_Source": payload.Event_Source or "Business Card Import",
        "Notes": payload.Notes,
        "Next_Followup_Date": payload.Next_Followup_Date if payload.Next_Followup_Date else None,
        "Raw_Extraction_JSON": payload.Raw_Extraction_JSON,
    }
