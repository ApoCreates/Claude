"""The capture loop.

Polls the active window on an interval, applies privacy filtering, and
stores meaningfully-changed text into semantic memory. It de-duplicates so
that staring at the same document doesn't create hundreds of near-identical
memories — only substantive changes are remembered.
"""

from __future__ import annotations

import difflib
import threading
import time

from ..config import settings
from ..memory import Memory
from . import privacy
from .sources import best_source


class CaptureEngine:
    def __init__(self, memory: Memory):
        self.memory = memory
        self.source, self.mode = best_source()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._paused = not settings.capture_enabled
        self._last_text = ""
        self._last_app = ""
        self._last_store_ts = 0.0
        self.captures = 0
        self.last_snapshot: dict | None = None

    # -- lifecycle -----------------------------------------------------
    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="capture", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def pause(self) -> None:
        self._paused = True

    def resume(self) -> None:
        self._paused = False

    @property
    def paused(self) -> bool:
        return self._paused

    def status(self) -> dict:
        return {
            "mode": self.mode,
            "running": bool(self._thread and self._thread.is_alive()),
            "paused": self._paused,
            "captures": self.captures,
            "interval_s": settings.capture_interval_s,
            "last": self.last_snapshot,
        }

    # -- core loop -----------------------------------------------------
    def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                if not self._paused:
                    self._tick()
            except Exception:
                pass
            self._stop.wait(settings.capture_interval_s)

    def _changed_enough(self, text: str) -> bool:
        if not self._last_text:
            return True
        ratio = difflib.SequenceMatcher(None, self._last_text, text).quick_ratio()
        return ratio < 0.92  # >8% change is "substantive"

    def _tick(self) -> None:
        snap = self.source.snapshot()
        if snap is None:
            return
        text = privacy.redact(snap.text)
        self.last_snapshot = {
            "app": snap.app, "title": snap.title,
            "chars": len(text), "ts": time.time(),
        }
        if not privacy.should_capture(snap.app, snap.title, text):
            return
        if not self._changed_enough(text):
            return
        # Rate-limit: don't store more than once per interval per window.
        now = time.time()
        if now - self._last_store_ts < settings.capture_interval_s * 0.9 \
                and snap.app == self._last_app:
            return

        self.memory.remember(
            text,
            kind="observation",
            source=snap.app or "screen",
            title=snap.title or None,
            meta={"app": snap.app, "window": snap.title, "mode": self.mode},
        )
        self._last_text = text
        self._last_app = snap.app
        self._last_store_ts = now
        self.captures += 1
