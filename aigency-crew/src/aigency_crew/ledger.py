"""Cross-run memory: the outer loop.

The inner loop (produce -> audit -> revise) improves one artifact. The ledger
is what stops the engine relearning the same lesson every Monday. Auditors
write durable rules into it; the next run reads them back into the agents'
prompts, and every id ever surfaced is remembered so week two brings new names
instead of last week's list rephrased.

Storage is a single JSON file, deliberately. It is inspectable, diffable, and
easy to hand-edit when a human disagrees with something an auditor concluded.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional

DEFAULT_LEDGER = Path("state/ledger.json")
MAX_LEARNINGS_PER_STAGE = 40


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Ledger:
    """Durable, human-readable memory shared by all six agents."""

    path: Path = DEFAULT_LEDGER
    data: dict[str, Any] = field(default_factory=dict)

    # -- lifecycle ---------------------------------------------------------

    @classmethod
    def load(cls, path: Path | str = DEFAULT_LEDGER) -> "Ledger":
        path = Path(path)
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                # A corrupt ledger must not take the run down with it; keep the
                # bad file for inspection and continue from empty.
                path.rename(path.with_suffix(".corrupt.json"))
                data = {}
        else:
            data = {}
        data.setdefault("learnings", {})
        data.setdefault("seen_ids", {})
        data.setdefault("runs", [])
        data.setdefault("outcomes", {})
        return cls(path=path, data=data)

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps(self.data, indent=2, sort_keys=False, default=str) + "\n",
            encoding="utf-8",
        )

    # -- learnings ---------------------------------------------------------

    def add_learnings(self, stage: str, notes: Iterable[str]) -> int:
        """Store deduplicated rules for a stage. Returns how many were new."""
        bucket: list[dict[str, str]] = self.data["learnings"].setdefault(stage, [])
        known = {entry["note"].strip().lower() for entry in bucket}
        added = 0
        for note in notes:
            note = (note or "").strip()
            key = note.lower()
            if not note or key in known:
                continue
            bucket.append({"note": note, "added_on": _now()})
            known.add(key)
            added += 1
        # Newest rules win when the list is trimmed — old advice goes stale.
        if len(bucket) > MAX_LEARNINGS_PER_STAGE:
            self.data["learnings"][stage] = bucket[-MAX_LEARNINGS_PER_STAGE:]
        return added

    def learnings(self, stage: str) -> list[str]:
        return [entry["note"] for entry in self.data["learnings"].get(stage, [])]

    def briefing(self, stage: str, limit: int = 15) -> str:
        """Learnings rendered for injection into a task prompt."""
        notes = self.learnings(stage)[-limit:]
        if not notes:
            return "No prior learnings recorded for this stage yet."
        return "\n".join(f"- {note}" for note in notes)

    # -- deduplication -----------------------------------------------------

    def seen(self, stage: str) -> list[str]:
        return list(self.data["seen_ids"].get(stage, {}).keys())

    def remember_ids(self, stage: str, ids: Iterable[str]) -> None:
        bucket: dict[str, str] = self.data["seen_ids"].setdefault(stage, {})
        for item_id in ids:
            item_id = (item_id or "").strip()
            if item_id:
                bucket.setdefault(item_id, _now())

    def novel(self, stage: str, ids: Iterable[str]) -> list[str]:
        """Subset of ``ids`` this engine has never surfaced before."""
        known = self.data["seen_ids"].get(stage, {})
        return [i for i in ids if i not in known]

    # -- campaign outcomes (the commercial feedback signal) ----------------

    def record_outcome(
        self,
        campaign: str,
        *,
        sent: int = 0,
        replies: int = 0,
        meetings: int = 0,
        won: int = 0,
        segment: str = "",
    ) -> None:
        """Log what a campaign actually did.

        This is the only input to the engine that is not agent-generated, and
        it is the one that matters most: it is what turns the next prospecting
        round from a guess into a correction.
        """
        self.data["outcomes"][campaign] = {
            "segment": segment,
            "sent": sent,
            "replies": replies,
            "meetings": meetings,
            "won": won,
            "reply_rate": round(replies / sent, 4) if sent else None,
            "meeting_rate": round(meetings / sent, 4) if sent else None,
            "recorded_on": _now(),
        }

    def performance_brief(self) -> str:
        """What has and has not worked, for the prospector and the copywriter."""
        outcomes = self.data.get("outcomes", {})
        if not outcomes:
            return (
                "No campaign results recorded yet. Treat all channel and segment "
                "assumptions as unproven and state them as hypotheses."
            )
        rows = []
        for name, o in sorted(
            outcomes.items(),
            key=lambda kv: kv[1].get("reply_rate") or 0.0,
            reverse=True,
        ):
            rate = o.get("reply_rate")
            rows.append(
                f"- {name} (segment: {o.get('segment') or 'n/a'}): "
                f"{o.get('sent', 0)} sent, "
                f"reply rate {f'{rate:.1%}' if rate is not None else 'n/a'}, "
                f"{o.get('meetings', 0)} meetings, {o.get('won', 0)} won"
            )
        return "\n".join(rows)

    # -- run log -----------------------------------------------------------

    def record_run(self, run_id: str, summary: dict[str, Any]) -> None:
        self.data["runs"].append(
            {"run_id": run_id, "at": _now(), **summary}
        )
        self.data["runs"] = self.data["runs"][-50:]

    def last_run(self) -> Optional[dict[str, Any]]:
        runs = self.data.get("runs", [])
        return runs[-1] if runs else None
