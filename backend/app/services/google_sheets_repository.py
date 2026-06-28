"""
app/services/google_sheets_repository.py
──────────────────────────────────────────────────────────────────────────────
Google Sheets implementation of AbstractContactRepository.

Reads header row dynamically — column order in the sheet does NOT matter.
New fields added: Alternate_Phone, Alternate_Email, Status, Import_Source,
Raw_Extraction_JSON.
"""

from __future__ import annotations

import json
import os
import time
from copy import deepcopy
from datetime import date
from typing import Any

from app.core.exceptions import ContactAlreadyExistsError, ContactNotFoundError, DataSourceError
from app.core.logging import get_logger

logger = get_logger(__name__)

CONTACT_FIELDS: list[str] = [
    "Contact_ID",
    "Name",
    "Designation",
    "Company",
    "Parent_Organization",
    "Sector",
    "Company_Type",
    "Address",
    "City",
    "State",
    "Country",
    "Phone",
    "Alternate_Phone",
    "Email",
    "Alternate_Email",
    "Website",
    "LinkedIn",
    "Contact_Priority",
    "Status",
    "Event_Source",
    "Source_Type",
    "Import_Source",
    "Date_Added",
    "Last_Updated",
    "Next_Followup_Date",
    "AI_Tags",
    "AI_Summary",
    "Notes",
    "Raw_Extraction_JSON",
]

DATE_FIELDS = {"Date_Added", "Next_Followup_Date", "Last_Updated"}
LIST_FIELDS = {"AI_Tags"}
DEFAULT_SHEET_NAME = "Contacts"
CACHE_TTL_SECONDS = 30


class GoogleSheetsRepository:
    def __init__(self, spreadsheet_id: str, credentials_json: str, sheet_name: str | None = None) -> None:
        if not spreadsheet_id:
            raise DataSourceError("GOOGLE_SHEETS_SPREADSHEET_ID is not set.")
        if not credentials_json:
            raise DataSourceError("GOOGLE_SHEETS_CREDENTIALS_JSON is not set.")

        self._spreadsheet_id = spreadsheet_id
        self._sheet_name = sheet_name or os.getenv("GOOGLE_SHEETS_CONTACTS_SHEET_NAME", DEFAULT_SHEET_NAME)
        self._service = _build_sheets_service(credentials_json)
        self._col_map: dict[str, int] = {}
        self._cache: list[dict[str, Any]] = []
        self._cache_time: float = 0.0
        self._cached_sheet_id: int | None = None
        logger.info("GoogleSheetsRepository initialised | sheet=%s", self._sheet_name)

    # ── AbstractContactRepository interface ───────────────────────────────────

    def get_all(self) -> list[dict[str, Any]]:
        return deepcopy(self._cached_load())

    def get_by_id(self, contact_id: str) -> dict[str, Any] | None:
        for c in self._cached_load():
            if c.get("Contact_ID") == contact_id:
                return deepcopy(c)
        return None

    def create(self, contact: dict[str, Any]) -> dict[str, Any]:
        self._invalidate_cache()
        existing = self._cached_load()
        contact_id = contact["Contact_ID"]
        new_email = (contact.get("Email") or "").strip().lower()

        for c in existing:
            if c.get("Contact_ID") == contact_id:
                raise ContactAlreadyExistsError(f"Contact ID '{contact_id}' already exists.")
            if new_email and (c.get("Email") or "").strip().lower() == new_email:
                raise ContactAlreadyExistsError(f"Contact with email '{contact['Email']}' already exists.")

        row = self._dict_to_row(contact)
        self._sheets_append(row)
        self._invalidate_cache()
        logger.info("Contact created: %s", contact_id)
        return deepcopy(contact)

    def update(self, contact_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        self._invalidate_cache()
        all_contacts = self._cached_load()
        row_index = self._find_row_index(contact_id, all_contacts)
        if row_index is None:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")

        record = deepcopy(all_contacts[row_index - 2])
        for key, value in updates.items():
            if value is not None:
                record[key] = value
        record["Last_Updated"] = date.today()

        self._sheets_update_row(row_index, self._dict_to_row(record))
        self._invalidate_cache()
        logger.info("Contact updated: %s", contact_id)
        return deepcopy(record)

    def delete(self, contact_id: str) -> None:
        self._invalidate_cache()
        all_contacts = self._cached_load()
        row_index = self._find_row_index(contact_id, all_contacts)
        if row_index is None:
            raise ContactNotFoundError(f"Contact '{contact_id}' not found.")
        self._sheets_delete_row(row_index)
        self._invalidate_cache()
        logger.info("Contact deleted: %s", contact_id)

    def next_id(self) -> str:
        contacts = self._cached_load()
        nums = []
        for c in contacts:
            cid = c.get("Contact_ID", "")
            if isinstance(cid, str) and cid.startswith("CNT-") and cid[4:].isdigit():
                nums.append(int(cid[4:]))
        return f"CNT-{(max(nums, default=0) + 1):03d}"

    def get_distinct_values(self, field: str) -> list[str]:
        seen: set[str] = set()
        for c in self.get_all():
            val = c.get(field)
            if val and isinstance(val, str) and val.strip():
                seen.add(val.strip())
        return sorted(seen)

    # ── Cache ─────────────────────────────────────────────────────────────────

    def _cached_load(self) -> list[dict[str, Any]]:
        now = time.monotonic()
        if self._cache and (now - self._cache_time) < CACHE_TTL_SECONDS:
            return self._cache
        self._cache = self._load_all()
        self._cache_time = now
        return self._cache

    def _invalidate_cache(self) -> None:
        self._cache = []
        self._cache_time = 0.0

    # ── Sheets I/O ────────────────────────────────────────────────────────────

    def _load_all(self) -> list[dict[str, Any]]:
        try:
            result = (
                self._service.spreadsheets().values()
                .get(spreadsheetId=self._spreadsheet_id, range=f"'{self._sheet_name}'")
                .execute()
            )
        except Exception as exc:
            logger.error("GoogleSheets read failed: %s", exc)
            raise DataSourceError(f"Could not read from Google Sheets: {exc}") from exc

        rows: list[list[str]] = result.get("values", [])
        if not rows:
            logger.warning("Sheet is empty")
            return []

        header = [h.strip() for h in rows[0]]
        missing_fields = [f for f in CONTACT_FIELDS if f not in header]
        if missing_fields:
            new_header = header + missing_fields
            try:
                self._service.spreadsheets().values().update(
                    spreadsheetId=self._spreadsheet_id,
                    range=f"'{self._sheet_name}'!A1",
                    valueInputOption="USER_ENTERED",
                    body={"values": [new_header]},
                ).execute()
                header = new_header
                logger.info("Added missing header columns to sheet: %s", missing_fields)
            except Exception as exc:
                logger.error("Failed to append missing headers: %s", exc)

        self._col_map = {name: idx for idx, name in enumerate(header)}

        contacts: list[dict[str, Any]] = []
        for row in rows[1:]:
            contact = self._row_to_dict(row)
            if contact.get("Contact_ID"):
                contacts.append(contact)

        logger.debug("Loaded %d contacts from Sheets", len(contacts))
        return contacts

    def _row_to_dict(self, row: list[str]) -> dict[str, Any]:
        d: dict[str, Any] = {}
        for field in CONTACT_FIELDS:
            col_idx = self._col_map.get(field)
            raw = row[col_idx].strip() if col_idx is not None and col_idx < len(row) else ""

            if field in DATE_FIELDS:
                d[field] = _parse_date(raw)
            elif field in LIST_FIELDS:
                d[field] = _parse_list(raw)
            elif field in ("Phone", "Alternate_Phone"):
                val = raw
                if val.startswith("'"):
                    val = val[1:]
                d[field] = val or None
            else:
                d[field] = raw or None

        if not d.get("Status"):
            d["Status"] = "Active"
        return d

    def _dict_to_row(self, contact: dict[str, Any]) -> list[str]:
        if self._col_map:
            num_cols = max(self._col_map.values()) + 1
            row = [""] * num_cols
            for field, col_idx in self._col_map.items():
                val = _serialize_field(contact.get(field))
                if field in ("Phone", "Alternate_Phone") and val and not val.startswith("'"):
                    val = f"'{val}"
                row[col_idx] = val
        else:
            row = []
            for f in CONTACT_FIELDS:
                val = _serialize_field(contact.get(f))
                if f in ("Phone", "Alternate_Phone") and val and not val.startswith("'"):
                    val = f"'{val}"
                row.append(val)
        return row

    def _find_row_index(self, contact_id: str, contacts: list[dict[str, Any]]) -> int | None:
        for i, c in enumerate(contacts):
            if c.get("Contact_ID") == contact_id:
                return i + 2
        return None

    def _sheets_append(self, row: list[str]) -> None:
        try:
            self._service.spreadsheets().values().append(
                spreadsheetId=self._spreadsheet_id,
                range=f"'{self._sheet_name}'",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": [row]},
            ).execute()
        except Exception as exc:
            raise DataSourceError(f"Could not write to Google Sheets: {exc}") from exc

    def _sheets_update_row(self, row_index: int, row: list[str]) -> None:
        try:
            self._service.spreadsheets().values().update(
                spreadsheetId=self._spreadsheet_id,
                range=f"'{self._sheet_name}'!A{row_index}",
                valueInputOption="USER_ENTERED",
                body={"values": [row]},
            ).execute()
        except Exception as exc:
            raise DataSourceError(f"Could not update row {row_index}: {exc}") from exc

    def _sheets_delete_row(self, row_index: int) -> None:
        sheet_id = self._get_sheet_id()
        start_index = row_index - 1
        try:
            self._service.spreadsheets().batchUpdate(
                spreadsheetId=self._spreadsheet_id,
                body={"requests": [{"deleteDimension": {"range": {
                    "sheetId": sheet_id,
                    "dimension": "ROWS",
                    "startIndex": start_index,
                    "endIndex": start_index + 1,
                }}}]},
            ).execute()
        except Exception as exc:
            raise DataSourceError(f"Could not delete row {row_index}: {exc}") from exc

    def _get_sheet_id(self) -> int:
        if self._cached_sheet_id is not None:
            return self._cached_sheet_id
        try:
            meta = self._service.spreadsheets().get(spreadsheetId=self._spreadsheet_id).execute()
        except Exception as exc:
            raise DataSourceError(f"Could not read spreadsheet metadata: {exc}") from exc
        for sheet in meta.get("sheets", []):
            props = sheet.get("properties", {})
            if props.get("title") == self._sheet_name:
                self._cached_sheet_id = props["sheetId"]
                return self._cached_sheet_id
        raise DataSourceError(f"Sheet tab '{self._sheet_name}' not found.")


# ── Auth helper ────────────────────────────────────────────────────────────────

def _build_sheets_service(credentials_json: str):
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    stripped = credentials_json.strip()
    if stripped.startswith("{"):
        try:
            creds_data = json.loads(stripped)
        except json.JSONDecodeError as exc:
            raise DataSourceError(f"Invalid credentials JSON: {exc}") from exc
    else:
        path = os.path.expandvars(os.path.expanduser(stripped))
        if not os.path.isfile(path):
            raise DataSourceError(f"Credentials file not found: {path!r}")
        with open(path) as f:
            creds_data = json.load(f)
    try:
        creds = Credentials.from_service_account_info(creds_data, scopes=SCOPES)
        return build("sheets", "v4", credentials=creds, cache_discovery=False)
    except Exception as exc:
        raise DataSourceError(f"Auth failed: {exc}") from exc


# ── Type helpers ───────────────────────────────────────────────────────────────

def _parse_date(raw: str) -> date | None:
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            from datetime import datetime
            return datetime.strptime(raw.strip(), fmt).date()
        except ValueError:
            continue
    try:
        from dateutil import parser as dup
        return dup.parse(raw.strip()).date()
    except Exception:
        return None


def _parse_list(raw: str) -> list[str]:
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def _serialize_field(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    return str(value)
