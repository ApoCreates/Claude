"""Daily journals.

Summarises everything remembered during a day — what you worked on, apps
and documents touched, meetings — into a readable journal entry stored back
into memory so it too becomes searchable.
"""

from __future__ import annotations

import time
from collections import Counter

from .db import Database
from .llm import llm
from .memory import Memory

JOURNAL_PROMPT = """You are writing a concise daily work journal for the user \
based on what they did on {date}. Below are timestamped fragments captured \
from their screen and meetings. Write a well-organised journal entry with:

- A one-paragraph summary of the day.
- "Focus areas" as bullet points (projects/documents/topics).
- "Meetings" if any were transcribed.
- "Loose ends / follow-ups" you can reasonably infer.

Be specific but do not invent facts that aren't supported by the fragments.

FRAGMENTS:
{fragments}
"""


def _day_bounds(day_ts: float) -> tuple[float, float]:
    lt = time.localtime(day_ts)
    start = time.mktime((lt.tm_year, lt.tm_mon, lt.tm_mday, 0, 0, 0, 0, 0, -1))
    return start, start + 86400


class Journal:
    def __init__(self, db: Database, memory: Memory):
        self.db = db
        self.memory = memory

    def generate(self, day_ts: float | None = None) -> dict:
        day_ts = day_ts or time.time()
        start, end = _day_bounds(day_ts)
        date_str = time.strftime("%A, %B %d %Y", time.localtime(day_ts))

        rows = [r for r in self.db.recent_memories(start) if r["ts"] < end
                and r["kind"] in ("observation", "meeting")]
        if not rows:
            return {"date": date_str, "entry": f"No activity recorded for {date_str}.",
                    "apps": [], "fragment_count": 0}

        apps = Counter(r["source"] for r in rows if r["source"])
        fragments = []
        for r in rows[:120]:
            when = time.strftime("%H:%M", time.localtime(r["ts"]))
            head = (r["title"] or r["source"] or "").strip()
            fragments.append(f"[{when}] {head}: {r['text'][:300]}")

        entry = llm.complete(
            JOURNAL_PROMPT.format(date=date_str, fragments="\n".join(fragments)),
            temperature=0.5,
        )

        # Store the journal so it becomes part of memory too.
        self.memory.remember(entry, kind="journal", source="journal",
                             title=f"Journal — {date_str}", ts=end - 1)
        return {
            "date": date_str,
            "entry": entry,
            "apps": [{"app": a, "count": c} for a, c in apps.most_common(10)],
            "fragment_count": len(rows),
        }
