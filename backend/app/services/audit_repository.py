"""
app/services/audit_repository.py
──────────────────────────────────────────────────────────────────────────────
Append-only audit log repository backed by Google Sheets.

Sheet layout:
  Log_ID | Timestamp | User_ID | User_Name | Action | Contact_ID | Contact_Name | Details
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import DataSourceError
from app.core.logging import get_logger

logger = get_logger(__name__)

AUDIT_FIELDS = [
    "Log_ID", "Timestamp", "User_ID", "User_Name",
    "Action", "Contact_ID", "Contact_Name", "Details",
]

_log_counter = 0


class AuditRepository:
    def __init__(self, spreadsheet_id: str, credentials_json: str, sheet_name: str = "AuditLog") -> None:
        self._spreadsheet_id = spreadsheet_id
        self._sheet_name = sheet_name
        self._service = _build_sheets_service(credentials_json)
        logger.info("AuditRepository initialised | sheet=%s", sheet_name)

    def log(
        self,
        action: str,
        user_id: str = "system",
        user_name: str = "System",
        contact_id: str = "",
        contact_name: str = "",
        details: str = "",
    ) -> None:
        global _log_counter
        _log_counter += 1
        now = datetime.now(timezone.utc).isoformat()
        log_id = f"LOG-{now[:10].replace('-', '')}-{_log_counter:04d}"
        row = [log_id, now, user_id, user_name, action, contact_id, contact_name, details]
        try:
            self._service.spreadsheets().values().append(
                spreadsheetId=self._spreadsheet_id,
                range=f"'{self._sheet_name}'",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": [row]},
            ).execute()
        except Exception as exc:
            # Audit log failures are non-fatal — log but don't raise
            logger.warning("AuditLog write failed (non-fatal): %s", exc)


def _build_sheets_service(credentials_json: str):
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    stripped = credentials_json.strip()
    if stripped.startswith("{"):
        creds_data = json.loads(stripped)
    else:
        path = os.path.expandvars(os.path.expanduser(stripped))
        with open(path) as f:
            creds_data = json.load(f)
    creds = Credentials.from_service_account_info(creds_data, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds, cache_discovery=False)
