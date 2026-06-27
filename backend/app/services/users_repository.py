"""
app/services/users_repository.py
──────────────────────────────────────────────────────────────────────────────
Google Sheets repository for the Users sheet.

Sheet layout (row 1 = header):
  User_ID | Name | Email | Password_Hash | Role | Department | Status | Created_At | Last_Login
"""

from __future__ import annotations

import json
import os
import time
from copy import deepcopy
from datetime import date, datetime
from typing import Any

from app.core.exceptions import DataSourceError, UserAlreadyExistsError, UserNotFoundError
from app.core.logging import get_logger

logger = get_logger(__name__)

USER_FIELDS = [
    "User_ID",
    "Name",
    "Email",
    "Password_Hash",
    "Role",
    "Department",
    "Status",
    "Created_At",
    "Last_Login",
]

CACHE_TTL_SECONDS = 60


class UsersRepository:
    def __init__(self, spreadsheet_id: str, credentials_json: str, sheet_name: str = "Users") -> None:
        if not spreadsheet_id:
            raise DataSourceError("GOOGLE_SHEETS_SPREADSHEET_ID is not set.")
        if not credentials_json:
            raise DataSourceError("GOOGLE_SHEETS_CREDENTIALS_JSON is not set.")

        self._spreadsheet_id = spreadsheet_id
        self._sheet_name = sheet_name
        self._service = _build_sheets_service(credentials_json)
        self._col_map: dict[str, int] = {}
        self._cache: list[dict[str, Any]] = []
        self._cache_time: float = 0.0
        logger.info("UsersRepository initialised | sheet=%s", sheet_name)

    # ── Public interface ──────────────────────────────────────────────────────

    def get_all(self) -> list[dict[str, Any]]:
        return deepcopy(self._cached_load())

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        email_lower = email.strip().lower()
        for u in self._cached_load():
            if (u.get("Email") or "").strip().lower() == email_lower:
                return deepcopy(u)
        return None

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        for u in self._cached_load():
            if u.get("User_ID") == user_id:
                return deepcopy(u)
        return None

    def create(self, user: dict[str, Any]) -> dict[str, Any]:
        self._invalidate_cache()
        existing = self._cached_load()
        new_email = (user.get("Email") or "").strip().lower()
        for u in existing:
            if (u.get("Email") or "").strip().lower() == new_email:
                raise UserAlreadyExistsError(f"User with email '{user['Email']}' already exists.")

        row = self._dict_to_row(user)
        self._sheets_append(row)
        self._invalidate_cache()
        logger.info("User created: %s", user.get("Email"))
        return deepcopy(user)

    def update(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        self._invalidate_cache()
        all_users = self._cached_load()
        row_index = None
        record = None
        for i, u in enumerate(all_users):
            if u.get("User_ID") == user_id:
                row_index = i + 2
                record = deepcopy(u)
                break
        if row_index is None or record is None:
            raise UserNotFoundError(f"User '{user_id}' not found.")
        for k, v in updates.items():
            if v is not None:
                record[k] = v
        self._sheets_update_row(row_index, self._dict_to_row(record))
        self._invalidate_cache()
        return deepcopy(record)

    def next_id(self) -> str:
        users = self._cached_load()
        nums = []
        for u in users:
            uid = u.get("User_ID", "")
            if isinstance(uid, str) and uid.startswith("USR-") and uid[4:].isdigit():
                nums.append(int(uid[4:]))
        return f"USR-{(max(nums, default=0) + 1):03d}"

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
            logger.error("UsersRepository read failed: %s", exc)
            raise DataSourceError(f"Could not read Users sheet: {exc}") from exc

        rows = result.get("values", [])
        if not rows:
            return []

        header = rows[0]
        self._col_map = {name: idx for idx, name in enumerate(header)}
        users = []
        for row in rows[1:]:
            d: dict[str, Any] = {}
            for field in USER_FIELDS:
                col_idx = self._col_map.get(field)
                raw = row[col_idx].strip() if col_idx is not None and col_idx < len(row) else ""
                d[field] = raw or None
            if d.get("User_ID"):
                users.append(d)
        return users

    def _dict_to_row(self, user: dict[str, Any]) -> list[str]:
        if self._col_map:
            num_cols = max(self._col_map.values()) + 1
            row = [""] * num_cols
            for field, col_idx in self._col_map.items():
                val = user.get(field)
                row[col_idx] = str(val) if val is not None else ""
        else:
            row = [str(user.get(f) or "") for f in USER_FIELDS]
        return row

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
            raise DataSourceError(f"Could not write to Users sheet: {exc}") from exc

    def _sheets_update_row(self, row_index: int, row: list[str]) -> None:
        try:
            self._service.spreadsheets().values().update(
                spreadsheetId=self._spreadsheet_id,
                range=f"'{self._sheet_name}'!A{row_index}",
                valueInputOption="USER_ENTERED",
                body={"values": [row]},
            ).execute()
        except Exception as exc:
            raise DataSourceError(f"Could not update Users sheet row: {exc}") from exc


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
        raise DataSourceError(f"Failed to authenticate: {exc}") from exc
