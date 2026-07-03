"""Screen → tasks: the always-on follow-up engine.

Because LocalBird is already watching the screen all day, no connector is
needed to know what you owe people: commitments you typed, requests you
read, deadlines that crossed the screen. This engine periodically sweeps
recent screen memory (plus any synced mail/events), extracts concrete
action items, de-duplicates them against the existing task list, and files
them — with a notification when something new lands.
"""

from __future__ import annotations

import json
import re
import threading
import time

from . import notify
from .config import settings
from .db import Database
from .llm import llm

INSIGHTS_PROMPT = """You maintain the user's to-do list by scanning fragments \
captured from their screen (documents, chats, emails, calendars they viewed).
{user_line}Extract ONLY concrete, actionable tasks, commitments or follow-ups \
that belong to the user personally: things THEY promised, were directly asked \
to do, or dated deadlines for THEIR work.

BE EXTREMELY PICKY. Suggest a task only if you would bet the user keeps it:
- It must clearly relate to the user's own work, not general information.
- Skip: newsletters, promotions, ads, notifications, headlines, UI chrome,
  other people's tasks, FYIs, things already done, and anything vague.
- An email is a task ONLY if it asks the user for a concrete action or reply.
- Fewer, better: 0-3 suggestions is the normal outcome. Never exceed 5.
{learning_block}
Return ONLY a JSON array, no other text:
[{{"task": "specific action, self-contained", "due": "date or null", \
"context": "3-6 word source hint"}}]
If nothing clearly qualifies, return [].

FRAGMENTS:
{fragments}
"""


def build_learning_block(rejected: list[str], accepted: list[str]) -> str:
    """The learning curve: user feedback becomes selection criteria."""
    if not rejected and not accepted:
        return ""
    parts = ["\nLEARNED PREFERENCES (from the user's own actions):"]
    if rejected:
        parts.append("The user DELETED these earlier suggestions — never "
                     "suggest these or anything of the same kind:")
        parts += [f"- {t}" for t in rejected[:15]]
    if accepted:
        parts.append("The user KEPT/COMPLETED these — this is the kind of "
                     "task they want:")
        parts += [f"- {t}" for t in accepted[:10]]
    return "\n".join(parts) + "\n"


def filter_rejected(items: list[dict], rejected: list[str]) -> list[dict]:
    """Hard filter: drop any candidate similar to a previously-deleted task,
    even if the model suggests it again. Aggressive threshold on purpose."""
    return [it for it in items
            if not any(similar(it["task"], r, threshold=0.45) for r in rejected)]


def _tokens(s: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", (s or "").lower()))


def similar(a: str, b: str, threshold: float = 0.55) -> bool:
    """Token-overlap (Jaccard) similarity — cheap dedupe for task text."""
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return False
    return len(ta & tb) / len(ta | tb) >= threshold


class InsightsEngine:
    def __init__(self, db: Database):
        self.db = db
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self.last_run: float | None = None
        self.found_total = 0
        self.last_error: str | None = None

    # -- lifecycle ---------------------------------------------------------
    def start(self) -> None:
        if not settings.insights_enabled:
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, name="insights",
                                        daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        self._stop.wait(120)  # let first captures accumulate
        while not self._stop.is_set():
            try:
                self.run()
            except Exception as exc:
                self.last_error = str(exc)
            self._stop.wait(max(300, settings.insights_interval_min * 60))

    def status(self) -> dict:
        return {
            "enabled": settings.insights_enabled,
            "running": bool(self._thread and self._thread.is_alive()),
            "interval_min": settings.insights_interval_min,
            "last_run": self.last_run,
            "found_total": self.found_total,
            "learned_rejections": len(self.db.task_feedback("rejected", limit=500)),
            "learned_acceptances": len(self.db.task_feedback("accepted", limit=500)),
            "last_error": self.last_error,
            "requires_model": not llm.ollama_available(),
        }

    # -- the sweep -----------------------------------------------------------
    def run(self) -> dict:
        """Sweep screen memory since the last run; file new tasks."""
        if not llm.ollama_available():
            self.last_error = ("needs a local model — install Ollama and pull "
                               "one (e.g. `ollama pull llama3.1`)")
            return {"ok": False, "error": self.last_error, "added": []}
        self.last_error = None

        since = float(self.db.kv_get("insights_since", "0") or 0)
        if not since:
            since = time.time() - 6 * 3600  # first run: look back 6h
        rows = self.db.recent_memories(since, kinds=("observation", "email", "event"))
        self.last_run = time.time()
        if not rows:
            self.db.kv_set("insights_since", str(self.last_run))
            return {"ok": True, "added": [], "scanned": 0}

        fragments = []
        budget = 11000
        for r in rows[-90:]:
            head = (r["title"] or r["source"] or r["kind"] or "").strip()
            frag = f"[{head}] {r['text'][:260]}"
            budget -= len(frag)
            if budget <= 0:
                break
            fragments.append(frag)

        user_name = (self.db.kv_get("profile_name", "") or "").strip()
        glossary = (self.db.kv_get("profile_glossary", "") or "").strip()
        user_line = f"The user is {user_name}. " if user_name else ""
        if glossary:
            user_line += f"Their work involves: {glossary}. "
        rejected = [r["text"] for r in self.db.task_feedback("rejected", limit=40)]
        accepted = [r["text"] for r in self.db.task_feedback("accepted", limit=25)]
        raw = llm.complete(
            INSIGHTS_PROMPT.format(
                user_line=user_line,
                learning_block=build_learning_block(rejected, accepted),
                fragments="\n".join(fragments)),
            temperature=0.1)

        items: list[dict] = []
        m = re.search(r"\[.*\]", raw, re.S)
        if m:
            try:
                for it in json.loads(m.group(0)):
                    task = (it.get("task") or "").strip()
                    if task and len(task) > 8:
                        items.append({"task": task, "due": it.get("due"),
                                      "context": (it.get("context") or "screen")})
            except Exception:
                items = []

        # Hard learning filter: anything similar to a deleted suggestion is
        # dropped even if the model proposes it again.
        items = filter_rejected(items, rejected)

        existing = [r["text"] for r in self.db.tasks(include_done=True, limit=300)]
        added = []
        for it in items[:5]:
            if any(similar(it["task"], ex) for ex in existing):
                continue
            tid = self.db.add_task(it["task"], due=it.get("due"),
                                   source=f"screen · {it['context']}")
            existing.append(it["task"])
            added.append({"id": tid, **it})

        self.db.kv_set("insights_since", str(self.last_run))
        if added:
            self.found_total += len(added)
            notify.notify("LocalBird",
                          f"Found {len(added)} new follow-up"
                          f"{'s' if len(added) != 1 else ''} from your screen.")
        return {"ok": True, "added": added, "scanned": len(rows)}
