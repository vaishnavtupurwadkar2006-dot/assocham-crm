from typing import Optional

def normalize_website(v: Optional[str]) -> Optional[str]:
    """
    Accepts website values and normalizes them:
    - If the URL starts with http:// or https://, leave it unchanged.
    - Otherwise automatically prepend https://.
    """
    if v is None:
        return None
    trimmed = v.strip()
    if not trimmed:
        return None
    if trimmed.lower().startswith(("http://", "https://")):
        return trimmed
    return f"https://{trimmed}"
