"""Apple Calendar connector.

Pulls events from today through the day after tomorrow and ingests new/
changed ones into memory (kind="event"), so briefings can say "you have X
at 3pm" and chat can answer schedule questions.
"""

from __future__ import annotations

import json

from . import applescript as osa

_SCRIPT = """
set fieldSep to "{field}"
set recSep to "{record}"
set out to ""
set d1 to (current date) - (time of (current date))
set d2 to d1 + (3 * days)
tell application "Calendar"
    repeat with cal in calendars
        try
            set evs to (every event of cal whose start date ≥ d1 and start date ≤ d2)
            repeat with ev in evs
                try
                    set evId to uid of ev
                    set evTitle to summary of ev
                    set evStart to (start date of ev) as string
                    set evEnd to (end date of ev) as string
                    set evLoc to ""
                    try
                        set evLoc to location of ev
                    end try
                    set out to out & evId & fieldSep & evTitle & fieldSep & evStart & fieldSep & evEnd & fieldSep & evLoc & recSep
                end try
            end repeat
        end try
    end repeat
end tell
return out
"""


class CalendarConnector:
    name = "calendar"

    def __init__(self, db, memory):
        self.db = db
        self.memory = memory
        self.last_error: str | None = None
        self.synced_total = 0

    def _seen(self) -> set[str]:
        raw = self.db.kv_get("calendar_seen", "[]")
        try:
            return set(json.loads(raw))
        except Exception:
            return set()

    def _remember_seen(self, ids: set[str]) -> None:
        self.db.kv_set("calendar_seen", json.dumps(sorted(ids)[-800:]))

    def sync(self) -> int:
        script = _SCRIPT.format(field=osa.FIELD, record=osa.RECORD)
        ok, raw = osa.run(script, timeout=120)
        if not ok:
            self.last_error = raw
            return 0
        self.last_error = None

        seen = self._seen()
        new = 0
        for fields in osa.parse_records(raw):
            if len(fields) < 4:
                continue
            ev_id, title, start, end = fields[:4]
            loc = fields[4] if len(fields) > 4 else ""
            # Key on id+start so rescheduled events re-ingest.
            key = f"{ev_id}|{start}"
            if not ev_id or key in seen:
                continue
            seen.add(key)
            text = f"Calendar event: {title}\nStart: {start}\nEnd: {end}"
            if loc:
                text += f"\nLocation: {loc}"
            self.memory.remember(text, kind="event", source="Calendar",
                                 title=title or "(untitled event)",
                                 meta={"start": start, "end": end, "uid": ev_id})
            new += 1
        if new:
            self._remember_seen(seen)
            self.synced_total += new
        return new
