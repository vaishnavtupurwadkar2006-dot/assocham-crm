from __future__ import annotations
import re
"""
app/services/contact_service.py
──────────────────────────────────────────────────────────────────────────────
Business logic layer for contacts.
Extended with duplicate detection, dynamic filter values, and audit logging.
"""



import math
from datetime import date, datetime, timezone
from typing import Any

from app.core.exceptions import ContactNotFoundError
from app.core.logging import get_logger
from app.core.sectors import standardize_sector
from app.schemas.contact import (
    ContactCreate,
    ContactListParams,
    ContactListResponse,
    ContactResponse,
    DuplicateCheckResponse,
    PaginationMeta,
)
from app.services.base_repository import AbstractContactRepository

logger = get_logger(__name__)


class ContactService:
    def __init__(self, repo: AbstractContactRepository) -> None:
        self._repo = repo

    # ── Read ──────────────────────────────────────────────────────────────────

    def list_contacts(self, params: ContactListParams) -> ContactListResponse:
        all_contacts = self._repo.get_all()
        filtered = self._apply_filters(all_contacts, params)
        total = len(filtered)
        start = (params.page - 1) * params.page_size
        end = start + params.page_size
        page_data = filtered[start:end]
        responses = [self._to_response(c) for c in page_data]
        return ContactListResponse(
            data=responses,
            meta=PaginationMeta(
                page=params.page,
                page_size=params.page_size,
                total=total,
                total_pages=max(1, math.ceil(total / params.page_size)),
            ),
        )

    def get_contact(self, contact_id: str) -> ContactResponse:
        contact = self._repo.get_by_id(contact_id)
        if not contact:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")
        return self._to_response(contact)

    # ── Write ─────────────────────────────────────────────────────────────────

    def create_contact(
        self,
        payload: ContactCreate,
        user_id: str = "system",
        user_name: str = "System",
        audit_repo=None,
    ) -> ContactResponse:
        contact_id = self._repo.next_id()
        today = date.today().isoformat()
        data = payload.model_dump(exclude_none=False)
        data["Contact_ID"] = contact_id
        data["Date_Added"] = today
        data["Last_Updated"] = today
        data["Sector"] = standardize_sector(data.get("Sector"))
        if data.get("AI_Tags") and isinstance(data["AI_Tags"], list):
            data["AI_Tags"] = ", ".join(data["AI_Tags"])

        record = self._repo.create(data)
        logger.info("Contact created: %s | by=%s", contact_id, user_id)

        if audit_repo:
            try:
                audit_repo.log(
                    action="CREATE",
                    user_id=user_id,
                    user_name=user_name,
                    contact_id=contact_id,
                    contact_name=data.get("Name", ""),
                    details=f"Created via {data.get('Source_Type', 'Manual Entry')}",
                )
            except Exception:
                pass

        return self._to_response(record)

    def update_contact(
        self,
        contact_id: str,
        updates: dict[str, Any],
        user_id: str = "system",
        user_name: str = "System",
        audit_repo=None,
    ) -> ContactResponse:
        updates["Last_Updated"] = date.today().isoformat()
        if "Sector" in updates:
            updates["Sector"] = standardize_sector(updates["Sector"])
        if "AI_Tags" in updates and isinstance(updates["AI_Tags"], list):
            updates["AI_Tags"] = ", ".join(updates["AI_Tags"])

        record = self._repo.update(contact_id, updates)
        logger.info("Contact updated: %s | by=%s", contact_id, user_id)

        if audit_repo:
            try:
                audit_repo.log(
                    action="UPDATE",
                    user_id=user_id,
                    user_name=user_name,
                    contact_id=contact_id,
                    contact_name=record.get("Name", ""),
                    details=f"Fields updated: {', '.join(updates.keys())}",
                )
            except Exception:
                pass

        return self._to_response(record)

    def delete_contact(
        self,
        contact_id: str,
        user_id: str = "system",
        user_name: str = "System",
        audit_repo=None,
    ) -> None:
        contact = self._repo.get_by_id(contact_id)
        if not contact:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")

        contact_name = contact.get("Name", "")
        self._repo.delete(contact_id)
        logger.info("Contact deleted: %s | by=%s", contact_id, user_id)

        if audit_repo:
            try:
                audit_repo.log(
                    action="DELETE",
                    user_id=user_id,
                    user_name=user_name,
                    contact_id=contact_id,
                    contact_name=contact_name,
                    details="Contact permanently deleted",
                )
            except Exception:
                pass

    # ── Duplicate Detection ───────────────────────────────────────────────────

    def check_duplicate(
        self,
        email: str | None = None,
        phone: str | None = None,
        name: str | None = None,
        company: str | None = None,
        exclude_id: str | None = None,
    ) -> DuplicateCheckResponse:
        all_contacts = self._repo.get_all()
        best_match: dict[str, Any] | None = None
        best_confidence = 0.0
        best_reason = ""

        email_norm = _norm(email)
        phone_norm = _norm_phone(phone)
        name_norm = _norm(name)
        company_norm = _norm(company)

        for c in all_contacts:
            if exclude_id and c.get("Contact_ID") == exclude_id:
                continue

            confidence = 0.0
            reasons = []

            # Email match — highest confidence
            if email_norm and email_norm == _norm(c.get("Email")):
                confidence = max(confidence, 0.95)
                reasons.append("email match")
            elif email_norm and email_norm == _norm(c.get("Alternate_Email")):
                confidence = max(confidence, 0.90)
                reasons.append("alternate email match")

            # Phone match
            if phone_norm and phone_norm == _norm_phone(c.get("Phone")):
                confidence = max(confidence, 0.90)
                reasons.append("phone match")
            elif phone_norm and phone_norm == _norm_phone(c.get("Alternate_Phone")):
                confidence = max(confidence, 0.85)
                reasons.append("alternate phone match")

            # Name + Company match
            if (
                name_norm
                and company_norm
                and name_norm == _norm(c.get("Name"))
                and company_norm == _norm(c.get("Company"))
            ):
                confidence = max(confidence, 0.85)
                reasons.append("name + company match")
            elif name_norm and name_norm == _norm(c.get("Name")):
                confidence = max(confidence, 0.60)
                reasons.append("name match")

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = c
                best_reason = ", ".join(reasons)

        THRESHOLD = 0.75
        if best_confidence >= THRESHOLD and best_match:
            return DuplicateCheckResponse(
                is_duplicate=True,
                confidence=best_confidence,
                match_reason=best_reason,
                existing_contact=self._to_response(best_match),
            )

        return DuplicateCheckResponse(
            is_duplicate=False,
            confidence=best_confidence,
            match_reason=None,
            existing_contact=None,
        )

    # ── Filtered search (used by AI search) ──────────────────────────────────

    def search_contacts(self, filters: dict[str, Any]) -> list[ContactResponse]:
        all_contacts = self._repo.get_all()
        results = []

        for c in all_contacts:
            if not self._matches_ai_filters(c, filters):
                continue
            results.append(self._to_response(c))

        return results

    def get_distinct_values(self, field: str) -> list[str]:
        return self._repo.get_distinct_values(field)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _apply_filters(
        self, contacts: list[dict[str, Any]], params: ContactListParams
    ) -> list[dict[str, Any]]:
        results = contacts

        if params.search:
            q = params.search.lower()
            results = [
                c for c in results
                if any(
                    q in str(c.get(f, "") or "").lower()
                    for f in ["Name", "Company", "Email", "Phone", "Designation", "Sector", "City", "State"]
                )
            ]

        if params.sector:
            results = [c for c in results if _icontains(c.get("Sector"), params.sector)]
        if params.state:
            results = [c for c in results if _icontains(c.get("State"), params.state)]
        if params.city:
            results = [c for c in results if _icontains(c.get("City"), params.city)]
        if params.priority:
            results = [c for c in results if (c.get("Contact_Priority") or "").lower() == params.priority.lower()]
        if params.status:
            results = [c for c in results if (c.get("Status") or "Active").lower() == params.status.lower()]
        if params.source_type:
            results = [c for c in results if _icontains(c.get("Source_Type"), params.source_type)]
        if params.company_type:
            results = [c for c in results if _icontains(c.get("Company_Type"), params.company_type)]

        return results

    def _matches_ai_filters(self, c: dict[str, Any], filters: dict[str, Any]) -> bool:
        if filters.get("sector"):
            if not _icontains(c.get("Sector"), filters["sector"]):
                return False
        if filters.get("state"):
            if not _icontains(c.get("State"), filters["state"]):
                return False
        if filters.get("city"):
            if not _icontains(c.get("City"), filters["city"]):
                return False
        if filters.get("priority"):
            if (c.get("Contact_Priority") or "").lower() != filters["priority"].lower():
                return False
        if filters.get("status"):
            if (c.get("Status") or "Active").lower() != filters["status"].lower():
                return False
        if filters.get("designation_keyword"):
            if not _icontains(c.get("Designation"), filters["designation_keyword"]):
                return False
        if filters.get("company_keyword"):
            if not _icontains(c.get("Company"), filters["company_keyword"]):
                return False
        if filters.get("search"):
            q = filters["search"].lower()
            haystack = " ".join(
                str(c.get(f, "") or "")
                for f in ["Name", "Company", "Email", "Designation", "Sector", "City", "State", "Notes"]
            ).lower()
            if q not in haystack:
                return False
        return True

    @staticmethod
    def _to_response(c: dict[str, Any]) -> ContactResponse:
        tags = c.get("AI_Tags")
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        elif not isinstance(tags, list):
            tags = []

        return ContactResponse(
            Contact_ID=c.get("Contact_ID", ""),
            Name=c.get("Name"),
            Designation=c.get("Designation"),
            Company=c.get("Company"),
            Parent_Organization=c.get("Parent_Organization"),
            Sector=c.get("Sector"),
            Company_Type=c.get("Company_Type"),
            Address=c.get("Address"),
            City=c.get("City"),
            State=c.get("State"),
            Country=c.get("Country"),
            Phone=c.get("Phone"),
            Alternate_Phone=c.get("Alternate_Phone"),
            Email=c.get("Email"),
            Alternate_Email=c.get("Alternate_Email"),
            Website=c.get("Website"),
            LinkedIn=c.get("LinkedIn"),
            Contact_Priority=c.get("Contact_Priority"),
            Status=c.get("Status") or "Active",
            Event_Source=c.get("Event_Source"),
            Source_Type=c.get("Source_Type"),
            Import_Source=c.get("Import_Source"),
            Date_Added=str(c["Date_Added"]) if c.get("Date_Added") else None,
            Last_Updated=str(c["Last_Updated"]) if c.get("Last_Updated") else None,
            Next_Followup_Date=str(c["Next_Followup_Date"]) if c.get("Next_Followup_Date") else None,
            AI_Tags=tags,
            AI_Summary=c.get("AI_Summary"),
            Notes=c.get("Notes"),
            Raw_Extraction_JSON=c.get("Raw_Extraction_JSON"),
        )


# ── String helpers ─────────────────────────────────────────────────────────────

def _norm(val: Any) -> str:
    if not val:
        return ""
    return str(val).strip().lower()


def _norm_phone(val: Any) -> str:
    if not val:
        return ""
    digits = re.sub(r"\D", "", str(val))
    return digits[-10:] if len(digits) >= 10 else digits


def _icontains(field_val: Any, query: str) -> bool:
    if not field_val or not query:
        return False
    return query.lower() in str(field_val).lower()

