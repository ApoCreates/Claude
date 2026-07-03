"""Background connector sync loop."""

from __future__ import annotations

import threading
import time

from ..config import settings
from . import applescript as osa
from .calendar import CalendarConnector
from .mail import MailConnector


class ConnectorSync:
    def __init__(self, db, memory):
        self.connectors = []
        if osa.available():
            if "mail" in settings.connectors:
                self.connectors.append(MailConnector(db, memory))
            if "calendar" in settings.connectors:
                self.connectors.append(CalendarConnector(db, memory))
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self.last_sync: float | None = None

    def start(self) -> None:
        if not self.connectors:
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="connectors",
                                        daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        # First sync shortly after startup, then on the configured interval.
        self._stop.wait(20)
        while not self._stop.is_set():
            self.sync_now()
            self._stop.wait(max(60, settings.connector_interval_min * 60))

    def sync_now(self) -> dict:
        results = {}
        for c in self.connectors:
            try:
                results[c.name] = c.sync()
            except Exception as exc:
                c.last_error = str(exc)
                results[c.name] = 0
        self.last_sync = time.time()
        return results

    def status(self) -> dict:
        return {
            "available": osa.available(),
            "enabled": [c.name for c in self.connectors],
            "last_sync": self.last_sync,
            "connectors": [
                {"name": c.name, "synced_total": c.synced_total,
                 "last_error": c.last_error}
                for c in self.connectors
            ],
        }
