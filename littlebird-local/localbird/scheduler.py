"""Background scheduler for routines + nightly journals.

Deliberately dependency-free: a single daemon thread wakes every minute,
runs any routines that have come due, and generates the previous day's
journal shortly after midnight. This avoids pulling in APScheduler while
giving reliable daily/weekly/monthly cadences.
"""

from __future__ import annotations

import threading
import time

from .journals import Journal
from .routines import Routines


class Scheduler:
    def __init__(self, routines: Routines, journal: Journal):
        self.routines = routines
        self.journal = journal
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._last_journal_day = ""

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="scheduler", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                self._run_due_routines()
                self._maybe_journal()
            except Exception:
                pass
            self._stop.wait(60)

    def _run_due_routines(self) -> None:
        for rid in self.routines.due():
            try:
                self.routines.run(rid)
            except Exception:
                pass

    def _maybe_journal(self) -> None:
        lt = time.localtime()
        today = time.strftime("%Y-%m-%d", lt)
        # Generate yesterday's journal once, shortly after midnight.
        if lt.tm_hour == 0 and lt.tm_min < 10 and self._last_journal_day != today:
            self._last_journal_day = today
            try:
                self.journal.generate(time.time() - 3600)  # yesterday
            except Exception:
                pass
