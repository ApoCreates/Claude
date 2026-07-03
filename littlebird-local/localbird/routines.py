"""Proactive routines.

A routine is a saved prompt that runs on a schedule (daily / weekly /
monthly), e.g. "Give me a daily briefing of yesterday's work" or "Summarise
this week's meetings." Each run answers against current memory and stores
the result so you have a running log.
"""

from __future__ import annotations

import time

from .chat import ChatEngine
from .db import Database

STARTER_ROUTINES = [
    {
        "name": "Daily Briefing",
        "prompt": "Give me a briefing of what I worked on yesterday and what "
                  "seems most important to pick up today.",
        "cadence": "daily", "hour": 8, "minute": 30,
    },
    {
        "name": "Yesterday's Work Summary",
        "prompt": "Summarise everything I did yesterday across all apps in a "
                  "few tight bullet points.",
        "cadence": "daily", "hour": 18, "minute": 0,
    },
    {
        "name": "Weekly Activity Summary",
        "prompt": "Summarise my main projects, meetings and decisions from the "
                  "past week and flag anything unfinished.",
        "cadence": "weekly", "weekday": 4, "hour": 16, "minute": 0,  # Friday
    },
]


class Routines:
    def __init__(self, db: Database, chat: ChatEngine):
        self.db = db
        self.chat = chat

    def ensure_starters(self) -> None:
        if self.db.routines():
            return
        for r in STARTER_ROUTINES:
            self.db.add_routine(r["name"], r["prompt"], r["cadence"],
                                hour=r.get("hour", 8), minute=r.get("minute", 0),
                                weekday=r.get("weekday", 0), day=r.get("day", 1))

    def run(self, routine_id: int) -> dict:
        row = self.db.routine(routine_id)
        if not row:
            raise KeyError(f"routine {routine_id} not found")
        result = self.chat.ask(row["prompt"])
        output = result["answer"]
        run_id = self.db.add_routine_run(routine_id, output)
        return {"routine_id": routine_id, "run_id": run_id, "output": output,
                "sources": result["sources"], "ts": time.time()}

    def due(self, now: float | None = None) -> list[int]:
        """Return ids of routines whose scheduled time has passed today and
        that haven't already run in this cadence window."""
        now = now or time.time()
        lt = time.localtime(now)
        due_ids = []
        for r in self.db.routines(only_enabled=True):
            if not self._matches_day(r, lt):
                continue
            sched = time.mktime((lt.tm_year, lt.tm_mon, lt.tm_mday,
                                 r["hour"], r["minute"], 0, 0, 0, -1))
            if now < sched:
                continue
            if r["last_run"] and self._same_window(r, r["last_run"], now):
                continue
            due_ids.append(r["id"])
        return due_ids

    @staticmethod
    def _matches_day(r, lt) -> bool:
        if r["cadence"] == "daily":
            return True
        if r["cadence"] == "weekly":
            return lt.tm_wday == (r["weekday"] or 0)
        if r["cadence"] == "monthly":
            return lt.tm_mday == (r["day"] or 1)
        return False

    @staticmethod
    def _same_window(r, last_run: float, now: float) -> bool:
        """Has the routine already run within the current cadence window?"""
        if r["cadence"] == "daily":
            return time.strftime("%Y-%m-%d", time.localtime(last_run)) == \
                   time.strftime("%Y-%m-%d", time.localtime(now))
        if r["cadence"] == "weekly":
            return time.strftime("%Y-%W", time.localtime(last_run)) == \
                   time.strftime("%Y-%W", time.localtime(now))
        if r["cadence"] == "monthly":
            return time.strftime("%Y-%m", time.localtime(last_run)) == \
                   time.strftime("%Y-%m", time.localtime(now))
        return False
