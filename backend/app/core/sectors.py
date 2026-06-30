from typing import Optional

APPROVED_SECTORS = [
    "Agriculture",
    "Banking & Finance",
    "Biotechnology",
    "Consulting",
    "Education",
    "Energy",
    "Engineering",
    "Food & Beverage",
    "Government",
    "Handicrafts",
    "Healthcare",
    "Hospitality & Tourism",
    "Information Technology",
    "Legal",
    "Logistics & Supply Chain",
    "Manufacturing",
    "Media & Communications",
    "NGO / Non-Profit",
    "Pharmaceuticals",
    "Real Estate",
    "Renewable Energy",
    "Sustainability",
    "Other",
]

_APPROVED_LOWER = {s.lower(): s for s in APPROVED_SECTORS}


def standardize_sector(v: Optional[str]) -> Optional[str]:
    """
    Passthrough-only standardization.
    - If value is None or blank, return None.
    - If value exactly matches (case-insensitive) an approved sector, return the
      canonical casing.
    - Otherwise, return the value as-is — no fuzzy mapping, no forced 'Other'.
      Values sourced from the frontend dropdown or Gemini's guided prompt will
      always be from the approved list.
    """
    if v is None:
        return None
    trimmed = v.strip()
    if not trimmed:
        return None

    canonical = _APPROVED_LOWER.get(trimmed.lower())
    if canonical:
        return canonical

    # Pass through unknown values unchanged (should not normally occur
    # when the frontend enforces the dropdown).
    return trimmed
