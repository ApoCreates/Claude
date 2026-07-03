"""Native macOS notifications and question dialogs (via osascript).

Used by the meeting watcher to announce a detected meeting and ask whether
to record it — mirroring the "a meeting started, want me to take notes?"
experience. No-ops gracefully off macOS.
"""

from __future__ import annotations

import platform
import subprocess


def _osascript(script: str, timeout: int = 40) -> str:
    try:
        out = subprocess.run(["osascript", "-e", script],
                             capture_output=True, text=True, timeout=timeout)
        return out.stdout.strip()
    except Exception:
        return ""


def _q(text: str) -> str:
    """Escape a string for embedding in AppleScript double quotes."""
    return text.replace("\\", "\\\\").replace('"', '\\"')


def available() -> bool:
    return platform.system() == "Darwin"


def notify(title: str, message: str) -> None:
    if not available():
        return
    _osascript(
        f'display notification "{_q(message)}" with title "{_q(title)}"',
        timeout=10,
    )


def ask(title: str, message: str, yes: str = "Record", no: str = "Skip",
        timeout_s: int = 25) -> bool:
    """Show a dialog with two buttons; returns True if the user picked `yes`.

    Times out (returns False) if the user doesn't respond, so an unattended
    machine never starts recording by accident.
    """
    if not available():
        return False
    out = _osascript(
        f'display dialog "{_q(message)}" with title "{_q(title)}" '
        f'buttons {{"{_q(no)}", "{_q(yes)}"}} default button "{_q(yes)}" '
        f"giving up after {timeout_s}",
        timeout=timeout_s + 15,
    )
    # osascript output looks like: "button returned:Record, gave up:false"
    return f"button returned:{yes}" in out and "gave up:true" not in out
