"""Screen-context capture.

LocalBird reads the *text* of your active window (like the accessibility
tree of the frontmost app) rather than recording video or taking
screenshots. On macOS this uses the Accessibility API; on other platforms
it falls back to window titles so the rest of the app is still exercisable.
"""

from .engine import CaptureEngine

__all__ = ["CaptureEngine"]
