"""Jobs: a run you can stop, inspect, send back, and approve.

`GrowthEngine.run()` executes the whole sequence in one go. That is the right
shape for a cron job and the wrong shape for a person, who wants to read the
funding shortlist before a copywriter starts building a campaign on top of it.

A Job is the same three stages held apart by approval gates. Each stage runs,
parks at `awaiting_approval`, and goes no further until someone says so. Every
round of every stage is written to disk, so reverting to round 2 after the
loop's round 3 went sideways is a file read rather than a re-run.

This module has no FastAPI and no CrewAI in it: the state machine is testable
on its own, and the portal is a thin skin over it.
"""

from __future__ import annotations

import json
import os
import threading
import traceback
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

from ..engine import STAGES, GrowthEngine, dump_artifact
from ..loops import CycleResult

# A stage moves: pending -> running -> awaiting_approval -> approved
#                                   \-> failed
#                            (rejected sends it back to running)
PENDING = "pending"
RUNNING = "running"
AWAITING = "awaiting_approval"
APPROVED = "approved"
REJECTED = "rejected"
FAILED = "failed"

NEXT_STAGE = {"funding": "clients", "clients": "outreach", "outreach": None}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class RoundRecord:
    """One round of one stage, kept so it can be reverted to."""

    number: int
    score: float
    blockers: int
    verdict: str
    summary: str
    artifact: dict[str, Any]
    findings: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "number": self.number,
            "score": self.score,
            "blockers": self.blockers,
            "verdict": self.verdict,
            "summary": self.summary,
            "artifact": self.artifact,
            "findings": self.findings,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "RoundRecord":
        return cls(**data)


@dataclass
class StageState:
    stage: str
    status: str = PENDING
    rounds: list[RoundRecord] = field(default_factory=list)
    selected_round: Optional[int] = None
    escalated: bool = False
    reason: str = ""
    error: str = ""
    notes: list[dict[str, str]] = field(default_factory=list)
    evaluation: Optional[dict[str, Any]] = None
    started_at: str = ""
    finished_at: str = ""
    approved_at: str = ""

    # -- reading -----------------------------------------------------------

    @property
    def selected(self) -> Optional[RoundRecord]:
        if self.selected_round is None:
            return None
        return next((r for r in self.rounds if r.number == self.selected_round), None)

    @property
    def score(self) -> float:
        chosen = self.selected
        return chosen.score if chosen else 0.0

    @property
    def artifact(self) -> Optional[dict[str, Any]]:
        chosen = self.selected
        return chosen.artifact if chosen else None

    def latest_note(self) -> str:
        return self.notes[-1]["note"] if self.notes else ""

    # -- writing -----------------------------------------------------------

    def add_note(self, note: str, kind: str = "rejection") -> None:
        note = (note or "").strip()
        if note:
            self.notes.append({"note": note, "kind": kind, "at": _now()})

    def revert_to(self, round_number: int) -> RoundRecord:
        """Pick an earlier round as the one that counts."""
        target = next((r for r in self.rounds if r.number == round_number), None)
        if target is None:
            raise ValueError(
                f"{self.stage} has no round {round_number}; "
                f"available: {[r.number for r in self.rounds]}"
            )
        self.selected_round = round_number
        self.add_note(f"reverted to round {round_number}", kind="revert")
        return target

    def to_dict(self) -> dict[str, Any]:
        return {
            "stage": self.stage,
            "status": self.status,
            "rounds": [r.to_dict() for r in self.rounds],
            "selected_round": self.selected_round,
            "escalated": self.escalated,
            "reason": self.reason,
            "error": self.error,
            "notes": self.notes,
            "evaluation": self.evaluation,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "approved_at": self.approved_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "StageState":
        rounds = [RoundRecord.from_dict(r) for r in data.get("rounds", [])]
        return cls(**{**data, "rounds": rounds})


@dataclass
class Job:
    """One human-supervised pass through the three workstreams."""

    id: str
    created_at: str
    params: dict[str, Any] = field(default_factory=dict)
    stages: dict[str, StageState] = field(default_factory=dict)
    status: str = PENDING
    error: str = ""

    @classmethod
    def create(cls, params: Optional[dict[str, Any]] = None) -> "Job":
        return cls(
            id=f"job-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:4]}",
            created_at=_now(),
            params=params or {},
            stages={s: StageState(stage=s) for s in STAGES},
        )

    # -- state questions the UI asks --------------------------------------

    @property
    def current_stage(self) -> Optional[str]:
        """The stage that is running, or waiting on a person, or up next."""
        for stage in STAGES:
            if self.stages[stage].status in (RUNNING, AWAITING, REJECTED, FAILED):
                return stage
        for stage in STAGES:
            if self.stages[stage].status == PENDING:
                return stage
        return None

    @property
    def is_complete(self) -> bool:
        return all(self.stages[s].status == APPROVED for s in STAGES)

    @property
    def is_busy(self) -> bool:
        return any(self.stages[s].status == RUNNING for s in STAGES)

    def next_runnable(self) -> Optional[str]:
        """The stage that may start now, if any.

        A stage may run when it has not been approved, nothing is running, and
        every stage before it has been approved. That last clause is the gate.
        """
        if self.is_busy:
            return None
        for stage in STAGES:
            state = self.stages[stage]
            if state.status in (PENDING, REJECTED, FAILED):
                return stage
            if state.status == AWAITING:
                return None  # waiting on a person
        return None

    def blocked_reason(self) -> str:
        if self.is_busy:
            return "a stage is running"
        for stage in STAGES:
            if self.stages[stage].status == AWAITING:
                return f"{stage} is waiting for your approval"
        if self.is_complete:
            return "every stage approved"
        return ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at,
            "params": self.params,
            "status": self.status,
            "error": self.error,
            "current_stage": self.current_stage,
            "complete": self.is_complete,
            "stages": {s: state.to_dict() for s, state in self.stages.items()},
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Job":
        stages = {
            s: StageState.from_dict(d) for s, d in (data.get("stages") or {}).items()
        }
        return cls(
            id=data["id"],
            created_at=data.get("created_at", ""),
            params=data.get("params", {}),
            stages=stages or {s: StageState(stage=s) for s in STAGES},
            status=data.get("status", PENDING),
            error=data.get("error", ""),
        )


class JobStore:
    """Jobs on disk, one JSON file each. Inspectable and hand-editable."""

    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def path(self, job_id: str) -> Path:
        return self.root / f"{job_id}.json"

    def save(self, job: Job) -> None:
        """Write atomically.

        Stages run in background threads while the browser polls, so a plain
        write leaves a window where a reader sees half a file and concludes the
        job is corrupt. Write to a temp file in the same directory and rename:
        a reader sees either the old job or the new one, never a fragment.
        """
        payload = json.dumps(job.to_dict(), indent=2, default=str) + "\n"
        with self._lock:
            tmp = self.path(job.id).with_suffix(f".{os.getpid()}.tmp")
            tmp.write_text(payload, encoding="utf-8")
            os.replace(tmp, self.path(job.id))

    def load(self, job_id: str) -> Optional[Job]:
        path = self.path(job_id)
        if not path.exists():
            return None
        return Job.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def list(self) -> list[Job]:
        jobs = []
        for path in self.root.glob("job-*.json"):
            try:
                jobs.append(Job.from_dict(json.loads(path.read_text(encoding="utf-8"))))
            except (json.JSONDecodeError, KeyError):
                continue  # a half-written file must not break the index
        return sorted(jobs, key=lambda j: j.created_at, reverse=True)

    def delete(self, job_id: str) -> bool:
        path = self.path(job_id)
        if path.exists():
            path.unlink()
            return True
        return False


class JobRunner:
    """Runs stages for jobs, one at a time, in a background thread."""

    def __init__(
        self,
        store: JobStore,
        engine_factory: Callable[[], GrowthEngine],
        executor: Optional[Any] = None,
    ) -> None:
        self.store = store
        self.engine_factory = engine_factory
        self._executor = executor
        self._threads: dict[str, threading.Thread] = {}
        self._progress: dict[str, list[str]] = {}

    # -- progress ----------------------------------------------------------

    def progress(self, job_id: str) -> list[str]:
        return list(self._progress.get(job_id, []))

    def _note_progress(self, job_id: str, message: str) -> None:
        self._progress.setdefault(job_id, []).append(f"{_now()} · {message}")

    # -- launching ---------------------------------------------------------

    def start_stage(self, job: Job, stage: Optional[str] = None) -> str:
        """Kick off the next runnable stage. Returns the stage started."""
        stage = stage or job.next_runnable()
        if stage is None:
            raise ValueError(f"nothing can start: {job.blocked_reason()}")
        if job.is_busy:
            raise ValueError("a stage is already running for this job")
        if stage != STAGES[0]:
            previous = STAGES[STAGES.index(stage) - 1]
            if job.stages[previous].status != APPROVED:
                raise ValueError(
                    f"{stage} cannot start until {previous} is approved — "
                    "that gate is the point of the portal"
                )

        state = job.stages[stage]
        state.status = RUNNING
        state.started_at = _now()
        state.error = ""
        job.status = RUNNING
        self.store.save(job)

        thread = threading.Thread(
            target=self._run_stage_blocking, args=(job.id, stage), daemon=True
        )
        self._threads[job.id] = thread
        thread.start()
        return stage

    def _run_stage_blocking(self, job_id: str, stage: str) -> None:
        try:
            self.run_stage_now(job_id, stage)
        except Exception:  # noqa: BLE001 - a thread must never die silently
            job = self.store.load(job_id)
            if job:
                job.stages[stage].status = FAILED
                job.stages[stage].error = traceback.format_exc(limit=3)
                job.stages[stage].finished_at = _now()
                job.status = FAILED
                self.store.save(job)
            self._note_progress(job_id, f"[{stage}] failed — see the job for the traceback")

    def run_stage_now(self, job_id: str, stage: str) -> Job:
        """Run one stage to completion and park it for approval. Blocking."""
        job = self.store.load(job_id)
        if job is None:
            raise ValueError(f"no such job: {job_id}")

        state = job.stages[stage]
        engine = self.engine_factory()
        engine.report = lambda msg: self._note_progress(job_id, msg)

        result = engine.run_stage(stage, self._stage_inputs(job, stage))
        self._record(job, stage, result)

        state.status = AWAITING
        state.finished_at = _now()
        job.status = AWAITING
        self.store.save(job)
        self._note_progress(job_id, f"[{stage}] waiting for your approval")
        return job

    def _stage_inputs(self, job: Job, stage: str) -> dict[str, Any]:
        """What this stage needs, including anything a person sent back."""
        inputs: dict[str, Any] = {}
        note = job.stages[stage].latest_note()
        if note:
            inputs["feedback"] = (
                "A human reviewer sent your previous attempt back with this "
                f"instruction. It outranks your own judgement:\n{note}"
            )
            previous = job.stages[stage].artifact
            if previous:
                inputs["previous_json"] = json.dumps(previous, indent=2)[:20_000]

        if stage == "outreach":
            inputs["approved_prospects"] = json.dumps(
                job.stages["clients"].artifact or {}, indent=2
            )[:20_000]
            inputs["approved_funding"] = json.dumps(
                job.stages["funding"].artifact or {}, indent=2
            )[:20_000]
        return inputs

    def _record(self, job: Job, stage: str, result: CycleResult) -> None:
        """Persist every round, not just the one the loop settled on."""
        state = job.stages[stage]
        offset = len(state.rounds)
        for rnd in result.history:
            state.rounds.append(
                RoundRecord(
                    number=offset + rnd.number,
                    score=rnd.score,
                    blockers=rnd.blocker_count,
                    verdict=rnd.audit.verdict,
                    summary=rnd.audit.summary,
                    artifact=json.loads(dump_artifact(rnd.artifact, limit=10**9)),
                    findings=[f.model_dump() for f in rnd.audit.findings],
                )
            )
        best = max(
            (r for r in state.rounds[offset:]),
            key=lambda r: (r.blockers == 0, r.score, -r.number),
        )
        state.selected_round = best.number
        state.escalated = result.outcome.escalated
        state.reason = result.outcome.reason

    # -- the gates ---------------------------------------------------------

    def approve(self, job: Job, stage: str, note: str = "", auto_start_next: bool = True) -> Job:
        state = job.stages[stage]
        if state.status not in (AWAITING, REJECTED, APPROVED):
            raise ValueError(f"{stage} is {state.status}; there is nothing to approve yet")
        state.status = APPROVED
        state.approved_at = _now()
        state.add_note(note, kind="approval")
        job.status = APPROVED if job.is_complete else PENDING
        self.store.save(job)
        self._note_progress(job.id, f"[{stage}] approved")

        if auto_start_next and NEXT_STAGE[stage] and not job.is_complete:
            self.start_stage(job, NEXT_STAGE[stage])
        return job

    def reject(self, job: Job, stage: str, note: str, rerun: bool = True) -> Job:
        """Send a stage back with an instruction, and optionally re-run it now."""
        if not (note or "").strip():
            raise ValueError("rejecting a stage needs a note saying what to change")
        state = job.stages[stage]
        state.status = REJECTED
        state.add_note(note, kind="rejection")
        job.status = PENDING
        self.store.save(job)
        self._note_progress(job.id, f"[{stage}] sent back: {note[:80]}")

        if rerun:
            self.start_stage(job, stage)
        return job

    def revert(self, job: Job, stage: str, round_number: int) -> Job:
        job.stages[stage].revert_to(round_number)
        self.store.save(job)
        self._note_progress(job.id, f"[{stage}] reverted to round {round_number}")
        return job

    def evaluate(
        self,
        job: Job,
        stage: str,
        score: Optional[float],
        notes: str,
        ledger: Optional[Any] = None,
    ) -> Job:
        """Record a human's verdict — and teach the agents from it.

        A rating that stays in the portal is a rating nobody learns from, so
        the note is written into the ledger as a standing rule for this stage.
        """
        job.stages[stage].evaluation = {
            "score": score,
            "notes": notes,
            "at": _now(),
        }
        self.store.save(job)

        if ledger is not None and (notes or "").strip():
            ledger.add_learnings(stage, [f"Human review: {notes.strip()}"])
            ledger.save()
        self._note_progress(job.id, f"[{stage}] evaluated by a human")
        return job
