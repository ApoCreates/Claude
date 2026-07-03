"""Privacy filtering for captured text.

Two jobs:
1. Skip whole windows that belong to excluded/sensitive apps.
2. Redact obviously sensitive substrings (passwords, card numbers, keys)
   from anything that is captured, before it ever hits the database.
"""

from __future__ import annotations

import re

from ..config import settings

# Redaction patterns applied to captured text.
_PATTERNS = [
    (re.compile(r"\b(?:\d[ -]?){13,19}\b"), "[redacted-card]"),            # card numbers
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b(?=.{0,20}password)",
                re.I), "[redacted]"),
    (re.compile(r"(?i)(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*\S+"),
     r"\1: [redacted]"),
    (re.compile(r"\b(sk|pk|ghp|gho|xox[baprs])-[A-Za-z0-9_\-]{16,}\b"), "[redacted-key]"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----",
                re.S), "[redacted-private-key]"),
]

_SENSITIVE_TITLE = re.compile(
    r"(?i)\b(password|sign in|log ?in|checkout|payment|billing|card number|"
    r"private browsing|incognito)\b"
)


def app_excluded(app_name: str) -> bool:
    name = (app_name or "").lower()
    return any(ex.lower() in name for ex in settings.excluded_apps)


def title_sensitive(title: str) -> bool:
    return bool(_SENSITIVE_TITLE.search(title or ""))


def redact(text: str) -> str:
    out = text or ""
    for pat, repl in _PATTERNS:
        out = pat.sub(repl, out)
    return out


def should_capture(app_name: str, title: str, text: str) -> bool:
    if app_excluded(app_name):
        return False
    if title_sensitive(title):
        return False
    if len((text or "").strip()) < settings.capture_min_chars:
        return False
    return True
