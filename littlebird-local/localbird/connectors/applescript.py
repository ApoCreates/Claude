"""Tiny AppleScript runner shared by the Mail/Calendar connectors."""

from __future__ import annotations

import platform
import subprocess

# Field/record separators unlikely to appear in real content.
FIELD = "␟"   # symbol for unit separator
RECORD = "␞"  # symbol for record separator


def available() -> bool:
    return platform.system() == "Darwin"


def run(script: str, timeout: int = 60) -> tuple[bool, str]:
    """Run an AppleScript; returns (ok, stdout-or-error)."""
    if not available():
        return False, "AppleScript is only available on macOS"
    try:
        out = subprocess.run(["osascript", "-e", script],
                             capture_output=True, text=True, timeout=timeout)
        if out.returncode != 0:
            return False, (out.stderr or "osascript failed").strip()
        return True, out.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "AppleScript timed out"
    except Exception as exc:
        return False, str(exc)


def parse_records(raw: str) -> list[list[str]]:
    """Split runner output into records/fields using our separators."""
    records = []
    for rec in raw.split(RECORD):
        rec = rec.strip()
        if rec:
            records.append([f.strip() for f in rec.split(FIELD)])
    return records
