"""
app/core/logging.py
──────────────────────────────────────────────────────────────────────────────
Structured logging setup.  Call configure_logging() once at startup.
Uses Python's stdlib logging — no external dependency needed now, but the
format is JSON-friendly so a log aggregator (Cloud Logging, Datadog) can
parse it later without code changes.
"""

import logging
import sys
from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()

    level = logging.DEBUG if settings.debug else logging.INFO

    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=date_fmt))

    # Root logger
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        "Logging configured | level=%s | env=%s",
        logging.getLevelName(level),
        settings.environment,
    )


def get_logger(name: str) -> logging.Logger:
    """Convenience wrapper — use instead of logging.getLogger() directly."""
    return logging.getLogger(name)
