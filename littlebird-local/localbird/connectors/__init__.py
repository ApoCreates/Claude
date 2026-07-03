"""Local connectors.

These read data that already lives on your Mac — Apple Mail and Calendar —
through AppleScript, and feed it into semantic memory. Nothing talks to any
cloud API; if your accounts (Gmail, iCloud, Exchange…) are added to the
macOS Mail/Calendar apps, LocalBird sees them locally.

macOS will show an "Automation" permission prompt the first time each app
is accessed — click Allow.
"""

from .sync import ConnectorSync

__all__ = ["ConnectorSync"]
