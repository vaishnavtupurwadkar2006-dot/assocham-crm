"""
app/services/base_repository.py
──────────────────────────────────────────────────────────────────────────────
Abstract base class for the contact repository.
Extended with get_distinct_values() for dynamic AI search.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AbstractContactRepository(ABC):

    @abstractmethod
    def get_all(self) -> list[dict[str, Any]]:
        """Return all contacts as raw dicts."""
        ...

    @abstractmethod
    def get_by_id(self, contact_id: str) -> dict[str, Any] | None:
        """Return a single contact dict or None if not found."""
        ...

    @abstractmethod
    def create(self, contact: dict[str, Any]) -> dict[str, Any]:
        """Persist a new contact and return it."""
        ...

    @abstractmethod
    def update(self, contact_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        """Merge updates into the existing contact and return the updated dict."""
        ...

    @abstractmethod
    def delete(self, contact_id: str) -> None:
        """Remove the contact."""
        ...

    def get_distinct_values(self, field: str) -> list[str]:
        """
        Return sorted distinct non-empty values for a field across all contacts.
        Default implementation works for all repos — override for performance.
        """
        seen: set[str] = set()
        for c in self.get_all():
            val = c.get(field)
            if val and isinstance(val, str) and val.strip():
                seen.add(val.strip())
        return sorted(seen)

    def next_id(self) -> str:
        """Generate next sequential contact ID. Override in implementations."""
        import uuid
        return f"CNT-{str(uuid.uuid4())[:6].upper()}"
