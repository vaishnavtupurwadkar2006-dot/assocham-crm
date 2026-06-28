import re
from typing import Optional

def normalize_phone_number(phone: Optional[str]) -> Optional[str]:
    """
    Normalize phone numbers by:
    - Trimming whitespace
    - Removing internal spaces, hyphens, and parentheses
    - Preserving a leading '+' if present
    """
    if phone is None:
        return None
    trimmed = phone.strip()
    if not trimmed:
        return trimmed
    has_plus = trimmed.startswith("+")
    # Remove all non-digits
    cleaned = re.sub(r"\D", "", trimmed)
    if has_plus:
        return "+" + cleaned
    return cleaned
