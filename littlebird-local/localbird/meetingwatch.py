"""Automatic meeting detection.

Watches for meeting apps (Zoom, Teams, FaceTime, Webex, Slack huddles) and
browser-based calls (Google Meet, Zoom web, Teams web). When a meeting
starts it sends a native notification and — depending on settings — asks
whether to record, records silently, or just notifies. When the meeting
ends it stops the recording, transcribes and summarises it automatically.
"""

from __future__ import annotations

import platform
import subprocess
import threading
import time

from . import notify
from .config import settings

# Processes that only exist while a call is ACTIVE (not merely while the app
# idles in the background). Zoom's in-meeting helper is "CptHost"; FaceTime
# only runs while its window is open. Do NOT list "zoom.us" or
# "Microsoft Teams" here — those run all day and caused false detections.
MEETING_PROCESSES = {
    "CptHost": "Zoom",
    "FaceTime": "FaceTime",
    "Meeting Center": "Webex",
}

# Substrings in the frontmost window title that indicate an active meeting
# (browser tabs and apps whose idle process can't be distinguished).
TITLE_HINTS = (
    "meet.google.com", "Google Meet", "Zoom Meeting", "Zoom Webinar",
    "| Microsoft Teams meeting", "Teams meeting", "Huddle", "- Webex",
    "whereby.com", "Jitsi Meet",
)

_FRONT_TITLE_SCRIPT = """
tell application "System Events"
    set p to first application process whose frontmost is true
    set t to ""
    try
        set t to title of front window of p
    end try
    return (name of p) & " — " & t
end tell
"""


def _running_meeting_app() -> str | None:
    """Return a friendly name if an ACTIVE meeting process is running."""
    try:
        out = subprocess.run(["ps", "-axo", "comm"], capture_output=True,
                             text=True, timeout=5).stdout
    except Exception:
        return None
    for proc, label in MEETING_PROCESSES.items():
        if proc in out:
            return label
    return None


def _frontmost_title() -> str:
    """Ask macOS directly for the frontmost app + window title.

    The watcher used to read the capture engine's last snapshot, which goes
    stale when capture is paused — meetings were missed. This is independent.
    """
    if platform.system() != "Darwin":
        return ""
    try:
        out = subprocess.run(["osascript", "-e", _FRONT_TITLE_SCRIPT],
                             capture_output=True, text=True, timeout=4)
        return out.stdout.strip()
    except Exception:
        return ""


class MeetingWatcher:
    """Polls for meetings; drives the recorder + summariser."""

    def __init__(self, meetings, capture) -> None:
        self.meetings = meetings      # MeetingService
        self.capture = capture        # CaptureEngine (for window titles)
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

        self.active_label: str | None = None
        self.active_since: float = 0.0
        self.recording_meeting = False
        self._declined = False
        self._absent_ticks = 0
        self._present_ticks = 0
        self._is_browser = False
        self.last_event: str = ""

    # -- lifecycle -------------------------------------------------------
    def start(self) -> None:
        if not settings.meeting_watch_enabled:
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="meetingwatch",
                                        daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def status(self) -> dict:
        return {
            "enabled": settings.meeting_watch_enabled,
            "running": bool(self._thread and self._thread.is_alive()),
            "mode": settings.meeting_autorecord,
            "in_meeting": self.active_label is not None,
            "meeting": self.active_label,
            "recording": self.recording_meeting,
            "since": self.active_since or None,
            "last_event": self.last_event,
        }

    # -- detection --------------------------------------------------------
    def _detect(self) -> tuple[str | None, bool]:
        """Return (label, is_title_based) for a meeting happening right now."""
        app = _running_meeting_app()
        if app:
            return app, False
        title = _frontmost_title()
        if not title:
            snap = self.capture.last_snapshot or {}
            title = f"{snap.get('title') or ''} {snap.get('app') or ''}"
        for hint in TITLE_HINTS:
            if hint.lower() in title.lower():
                return "Browser meeting", True
        return None, False

    # -- main loop ---------------------------------------------------------
    def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                self._tick()
            except Exception:
                pass
            self._stop.wait(5)

    def _tick(self) -> None:
        label, is_browser = self._detect()

        if label:
            self._absent_ticks = 0
            self._present_ticks += 1
            # Require 2 consecutive sightings (~10s) to avoid flapping.
            if self.active_label is None and self._present_ticks >= 2:
                self._on_meeting_start(label, is_browser)
        else:
            self._present_ticks = 0
            if self.active_label is not None:
                self._absent_ticks += 1
                # Browser meets flap when you switch tabs — wait longer.
                threshold = 12 if self._is_browser else 4  # ~60s vs ~20s
                if self._absent_ticks >= threshold:
                    self._on_meeting_end()

        # Safety: never record past the configured cap.
        if (self.recording_meeting and self.active_since and
                time.time() - self.active_since >
                settings.meeting_max_minutes * 60):
            self._on_meeting_end()

    # -- transitions --------------------------------------------------------
    def _on_meeting_start(self, label: str, is_browser: bool) -> None:
        self.active_label = label
        self.active_since = time.time()
        self._is_browser = is_browser
        self._declined = False
        self.last_event = f"detected {label}"

        mode = settings.meeting_autorecord
        if mode == "never":
            notify.notify("LocalBird", f"{label} detected. (Auto-record is off.)")
            return

        can_record = self.meetings.recorder.available()
        if not can_record:
            notify.notify("LocalBird",
                          f"{label} detected — install audio deps to enable "
                          "recording (pip install sounddevice numpy).")
            return

        if mode == "always":
            wants = True
            notify.notify("LocalBird", f"{label} detected — recording notes.")
        else:  # ask
            wants = notify.ask(
                "LocalBird",
                f"{label} started. Record and summarise this meeting?",
            )
        if wants:
            result = self.meetings.start_recording()
            self.recording_meeting = bool(result.get("ok"))
            self.last_event = f"recording {label}" if self.recording_meeting \
                else f"record failed: {result.get('error')}"
        else:
            self._declined = True
            self.last_event = f"declined recording {label}"

    def _on_meeting_end(self) -> None:
        label = self.active_label or "Meeting"
        started = self.active_since
        self.active_label = None
        self.active_since = 0.0
        self._absent_ticks = 0
        self.last_event = f"{label} ended"

        if not self.recording_meeting:
            return
        self.recording_meeting = False
        title = f"{label} — {time.strftime('%b %d %H:%M', time.localtime(started))}"
        result = self.meetings.stop_recording(title=title)
        if result.get("ok"):
            notify.notify("LocalBird",
                          f"{label} summarised — notes and action items are ready.")
            self.last_event = f"summarised {label}"
        else:
            notify.notify("LocalBird",
                          f"Could not summarise {label}: {result.get('error')}")
            self.last_event = f"summary failed: {result.get('error')}"
