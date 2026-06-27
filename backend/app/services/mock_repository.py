"""
app/services/mock_repository.py
──────────────────────────────────────────────────────────────────────────────
In-memory contact repository for development/testing.
"""

from __future__ import annotations

import copy
from datetime import date
from typing import Any

from app.core.exceptions import ContactAlreadyExistsError, ContactNotFoundError, UserAlreadyExistsError, UserNotFoundError
from app.core.logging import get_logger
from app.services.base_repository import AbstractContactRepository

logger = get_logger(__name__)

MOCK_CONTACTS_RAW: list[dict[str, Any]] = [
    {
        "Contact_ID": "CNT-001",
        "Name": "Rajesh Kumar",
        "Designation": "Managing Director",
        "Company": "InfraTech Solutions",
        "Parent_Organization": "InfraTech Group",
        "Sector": "Infrastructure",
        "Company_Type": "Private Limited",
        "City": "Mumbai",
        "State": "Maharashtra",
        "Country": "India",
        "Phone": "+919876543210",
        "Alternate_Phone": None,
        "Email": "rajesh.kumar@infratech.in",
        "Alternate_Email": None,
        "Website": "https://infratech.in",
        "LinkedIn": "https://linkedin.com/in/rajesh-kumar",
        "Contact_Priority": "High",
        "Status": "Active",
        "Event_Source": "ASSOCHAM Infrastructure Summit 2024",
        "Source_Type": "Business Card",
        "Import_Source": "Goa Summit 2024",
        "Date_Added": "2024-03-15",
        "Last_Updated": "2024-03-15",
        "Next_Followup_Date": None,
        "AI_Tags": ["infrastructure", "md", "mumbai"],
        "AI_Summary": "MD of InfraTech Solutions, key decision maker for infrastructure projects.",
        "Notes": "Interested in ASSOCHAM membership",
        "Raw_Extraction_JSON": None,
    },
    {
        "Contact_ID": "CNT-002",
        "Name": "Priya Sharma",
        "Designation": "CEO",
        "Company": "MedHealth Technologies",
        "Parent_Organization": None,
        "Sector": "Healthcare & Pharma",
        "Company_Type": "Startup",
        "City": "Bengaluru",
        "State": "Karnataka",
        "Country": "India",
        "Phone": "+918765432109",
        "Alternate_Phone": None,
        "Email": "priya@medhealth.io",
        "Alternate_Email": None,
        "Website": "https://medhealth.io",
        "LinkedIn": "https://linkedin.com/in/priya-sharma",
        "Contact_Priority": "High",
        "Status": "Active",
        "Event_Source": "ASSOCHAM Health Conclave 2024",
        "Source_Type": "Business Card",
        "Import_Source": "Health Conclave 2024",
        "Date_Added": "2024-04-10",
        "Last_Updated": "2024-04-10",
        "Next_Followup_Date": "2024-12-01",
        "AI_Tags": ["healthcare", "ceo", "startup", "bengaluru"],
        "AI_Summary": "CEO of healthtech startup, interested in policy advocacy.",
        "Notes": None,
        "Raw_Extraction_JSON": None,
    },
    {
        "Contact_ID": "CNT-003",
        "Name": "Vikram Mehta",
        "Designation": "Director",
        "Company": "GoaTech Exports",
        "Parent_Organization": "Mehta Group",
        "Sector": "Trade & Commerce",
        "Company_Type": "Partnership",
        "City": "Panaji",
        "State": "Goa",
        "Country": "India",
        "Phone": "+917654321098",
        "Alternate_Phone": "+917654321099",
        "Email": "vikram@goatech.in",
        "Alternate_Email": "mehta.vikram@gmail.com",
        "Website": None,
        "LinkedIn": None,
        "Contact_Priority": "Medium",
        "Status": "Active",
        "Event_Source": "ASSOCHAM Goa Business Meet 2024",
        "Source_Type": "Event",
        "Import_Source": "Goa Business Meet 2024",
        "Date_Added": "2024-05-20",
        "Last_Updated": "2024-05-20",
        "Next_Followup_Date": None,
        "AI_Tags": ["trade", "goa", "exports"],
        "AI_Summary": "Director at Mehta Group's export division.",
        "Notes": "Follow up on ASSOCHAM trade committee",
        "Raw_Extraction_JSON": None,
    },
]


class MockContactRepository(AbstractContactRepository):
    def __init__(self) -> None:
        self._store: dict[str, dict[str, Any]] = {
            c["Contact_ID"]: copy.deepcopy(c) for c in MOCK_CONTACTS_RAW
        }
        logger.info("MockContactRepository initialised with %d contacts", len(self._store))

    def get_all(self) -> list[dict[str, Any]]:
        return list(self._store.values())

    def get_by_id(self, contact_id: str) -> dict[str, Any] | None:
        return self._store.get(contact_id)

    def create(self, contact: dict[str, Any]) -> dict[str, Any]:
        contact_id = contact["Contact_ID"]
        if contact_id in self._store:
            raise ContactAlreadyExistsError(f"Contact ID '{contact_id}' already exists.")
        new_email = (contact.get("Email") or "").lower()
        if new_email:
            for existing in self._store.values():
                if (existing.get("Email") or "").lower() == new_email:
                    raise ContactAlreadyExistsError(f"Email '{contact['Email']}' already exists.")
        record = copy.deepcopy(contact)
        self._store[contact_id] = record
        logger.info("Contact created: %s", contact_id)
        return copy.deepcopy(record)

    def update(self, contact_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if contact_id not in self._store:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")
        record = self._store[contact_id]
        for key, value in updates.items():
            if value is not None:
                record[key] = value
        record["Last_Updated"] = date.today().isoformat()
        logger.info("Contact updated: %s", contact_id)
        return copy.deepcopy(record)

    def delete(self, contact_id: str) -> None:
        if contact_id not in self._store:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")
        del self._store[contact_id]
        logger.info("Contact deleted: %s", contact_id)

    def next_id(self) -> str:
        if not self._store:
            return "CNT-001"
        nums = []
        for cid in self._store:
            if cid.startswith("CNT-") and cid[4:].isdigit():
                nums.append(int(cid[4:]))
        return f"CNT-{(max(nums, default=0) + 1):03d}"

    def get_distinct_values(self, field: str) -> list[str]:
        seen: set[str] = set()
        for c in self._store.values():
            val = c.get(field)
            if val and isinstance(val, str) and val.strip():
                seen.add(val.strip())
        return sorted(seen)


class MockUsersRepository:
    def __init__(self) -> None:
        from app.core.security import hash_password
        self._store: dict[str, dict[str, Any]] = {}
        # Prepopulate with standard dev users
        dev_users = [
            {
                "User_ID": "USR-001",
                "Name": "ASSOCHAM Admin",
                "Email": "admin@assocham.org",
                "Password": "ChangeMe123!",
                "Role": "Admin",
                "Department": "Management",
                "Status": "Active",
                "Created_At": "2024-03-15T00:00:00Z",
                "Last_Login": "",
            },
            {
                "User_ID": "USR-002",
                "Name": "ASSOCHAM Staff",
                "Email": "staff@assocham.org",
                "Password": "ChangeMe123!",
                "Role": "Staff",
                "Department": "Operations",
                "Status": "Active",
                "Created_At": "2024-03-15T00:00:00Z",
                "Last_Login": "",
            },
            {
                "User_ID": "USR-003",
                "Name": "ASSOCHAM Intern",
                "Email": "intern@assocham.org",
                "Password": "ChangeMe123!",
                "Role": "Intern",
                "Department": "Research",
                "Status": "Active",
                "Created_At": "2024-03-15T00:00:00Z",
                "Last_Login": "",
            },
        ]
        for u in dev_users:
            pw = u.pop("Password")
            u["Password_Hash"] = hash_password(pw)
            self._store[u["User_ID"]] = u
        logger.info("MockUsersRepository initialised with %d users", len(self._store))

    def get_all(self) -> list[dict[str, Any]]:
        return list(copy.deepcopy(list(self._store.values())))

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        email_lower = email.strip().lower()
        for u in self._store.values():
            if u["Email"].lower() == email_lower:
                return copy.deepcopy(u)
        return None

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        u = self._store.get(user_id)
        return copy.deepcopy(u) if u else None

    def create(self, user: dict[str, Any]) -> dict[str, Any]:
        user_id = user["User_ID"]
        self._store[user_id] = copy.deepcopy(user)
        return copy.deepcopy(user)

    def update(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if user_id not in self._store:
            raise UserNotFoundError(f"User '{user_id}' not found.")
        record = self._store[user_id]
        for k, v in updates.items():
            if v is not None:
                record[k] = v
        return copy.deepcopy(record)

    def next_id(self) -> str:
        if not self._store:
            return "USR-001"
        nums = []
        for uid in self._store:
            if uid.startswith("USR-") and uid[4:].isdigit():
                nums.append(int(uid[4:]))
        return f"USR-{(max(nums, default=0) + 1):03d}"

