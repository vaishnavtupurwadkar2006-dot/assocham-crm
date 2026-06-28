"""
app/routers/contacts.py
──────────────────────────────────────────────────────────────────────────────
Contact CRUD endpoints with JWT auth guards.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.contact import (
    ContactCreate,
    ContactDeleteResponse,
    ContactDetailResponse,
    ContactListParams,
    ContactListResponse,
    ContactUpdate,
    DuplicateCheckResponse,
)
from app.services.contact_service import ContactService
from app.services.dependencies import (
    AdminOnly,
    CurrentUser,
    StaffOrAbove,
    get_audit_repository,
    get_contact_service,
)

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=ContactListResponse)
async def list_contacts(
    current_user: CurrentUser,
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    company_type: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    svc: ContactService = Depends(get_contact_service),
):
    params = ContactListParams(
        search=search,
        sector=sector,
        state=state,
        city=city,
        priority=priority,
        status=status,
        source_type=source_type,
        company_type=company_type,
        page=page,
        page_size=page_size,
    )
    return svc.list_contacts(params)


@router.get("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(
    current_user: CurrentUser,
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    exclude_id: Optional[str] = Query(None),
    svc: ContactService = Depends(get_contact_service),
):
    """Check if a contact with these details already exists."""
    return svc.check_duplicate(
        email=email,
        phone=phone,
        name=name,
        company=company,
        exclude_id=exclude_id,
    )


@router.get("/{contact_id}", response_model=ContactDetailResponse)
async def get_contact(
    contact_id: str,
    current_user: CurrentUser,
    svc: ContactService = Depends(get_contact_service),
):
    contact = svc.get_contact(contact_id)
    return ContactDetailResponse(data=contact)


@router.post("", response_model=ContactDetailResponse, status_code=201)
async def create_contact(
    payload: ContactCreate,
    current_user: StaffOrAbove,
    svc: ContactService = Depends(get_contact_service),
):
    audit_repo = get_audit_repository()
    contact = svc.create_contact(
        payload=payload,
        user_id=current_user.user_id,
        user_name=current_user.email,
        audit_repo=audit_repo,
    )
    return ContactDetailResponse(data=contact)


@router.put("/{contact_id}", response_model=ContactDetailResponse)
async def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    current_user: StaffOrAbove,
    svc: ContactService = Depends(get_contact_service),
):
    audit_repo = get_audit_repository()
    updates = payload.model_dump(exclude_unset=True)
    contact = svc.update_contact(
        contact_id=contact_id,
        updates=updates,
        user_id=current_user.user_id,
        user_name=current_user.email,
        audit_repo=audit_repo,
    )
    return ContactDetailResponse(data=contact)


@router.delete("/{contact_id}", response_model=ContactDeleteResponse)
async def delete_contact(
    contact_id: str,
    current_user: AdminOnly,
    svc: ContactService = Depends(get_contact_service),
):
    audit_repo = get_audit_repository()
    svc.delete_contact(
        contact_id=contact_id,
        user_id=current_user.user_id,
        user_name=current_user.email,
        audit_repo=audit_repo,
    )
    return ContactDeleteResponse(message=f"Contact {contact_id} deleted successfully.")
