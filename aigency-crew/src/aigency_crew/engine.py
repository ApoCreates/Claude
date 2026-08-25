"""Orchestration: three audited workstreams, wired into each other.

The inner loop lives in :mod:`aigency_crew.loops`. This module owns the two
loops above it:

*The cycle loop* — funding, then clients, then outreach. If the campaign comes
out weak, the usual cause is upstream: a thin prospect list gives the
copywriter nothing to personalise with. So a weak outreach result sends the
engine back to prospecting with the campaign auditor's findings in hand,
bounded by ``flow.max_cycles``.

*The ledger loop* — every audit's learnings and every id delivered are written
to :mod:`aigency_crew.ledger`, and read back into the next run's prompts. That
is what makes run five sharper than run one instead of merely different.

Nothing here imports CrewAI. The workstreams are injected, so the whole
orchestration can be exercised end to end with fakes.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional, Protocol

from .settings import Settings, output_dir
from .ledger import Ledger
from .loops import CycleResult, Decision, Round, run_audited_cycle
from .models import CycleOutcome

STAGES = ("funding", "clients", "outreach")


class Workstreamish(Protocol):
    """What the engine needs from a producer/auditor pair."""

    stage: str

    def produce(self, inputs: dict) -> Any: ...
    def revise(self, previous: Any, audit: Any, inputs: dict) -> Any: ...
    def audit(self, artifact: Any, inputs: dict, round_number: int) -> Any: ...


Reporter = Callable[[str], None]


@dataclass
class RunResult:
    run_id: str
    cycles_run: int = 0
    funding: Any = None
    prospects: Any = None
    campaign: Any = None
    outcomes: list[CycleOutcome] = field(default_factory=list)
    escalations: list[str] = field(default_factory=list)
    learnings_added: int = 0

    @property
    def needs_human(self) -> bool:
        return bool(self.escalations)

    def summary(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "cycles_run": self.cycles_run,
            "stages": [
                {
                    "stage": o.stage,
                    "rounds": o.rounds_run,
                    "score": o.final_score,
                    "accepted": o.accepted,
                    "escalated": o.escalated,
                    "reason": o.reason,
                    "score_history": o.score_history,
                }
                for o in self.outcomes
            ],
            "escalations": self.escalations,
            "learnings_added": self.learnings_added,
            "needs_human_review": self.needs_human,
        }


def _ids(artifact: Any) -> list[str]:
    getter = getattr(artifact, "ids", None)
    return list(getter()) if callable(getter) else []


def dump_artifact(artifact: Any, limit: int = 20_000) -> str:
    """Serialise an artifact for prompt injection or disk, trimmed to something sane."""
    if artifact is None:
        return "None available."
    dumper = getattr(artifact, "model_dump_json", None)
    text = dumper(indent=2) if callable(dumper) else json.dumps(artifact, default=str)
    return text if len(text) <= limit else text[:limit] + "\n... [truncated]"


class GrowthEngine:
    """Runs the three pairs, feeds them each other's output, and keeps the ledger."""

    def __init__(
        self,
        settings: Settings,
        ledger: Ledger,
        workstreams: dict[str, Workstreamish],
        reporter: Optional[Reporter] = None,
    ) -> None:
        missing = [s for s in STAGES if s not in workstreams]
        if missing:
            raise ValueError(f"missing workstreams for stage(s): {', '.join(missing)}")
        self.settings = settings
        self.ledger = ledger
        self.workstreams = workstreams
        self.report: Reporter = reporter or (lambda _msg: None)
        self.run_id = datetime.now(timezone.utc).strftime("run-%Y%m%d-%H%M%S")

    # -- one audited stage -------------------------------------------------

    def run_stage(self, stage: str, inputs: Optional[dict] = None) -> CycleResult:
        workstream = self.workstreams[stage]
        policy = self.settings.policy(stage)
        self.report(
            f"[{stage}] starting — pass mark {policy.pass_score:.0f}, "
            f"up to {policy.max_rounds} round(s)"
        )

        def on_round(rnd: Round, decision: Decision) -> None:
            self.report(
                f"[{stage}] round {rnd.number}: score {rnd.score:.1f}, "
                f"{rnd.blocker_count} blocker(s) -> {decision.action} ({decision.reason})"
            )

        result = run_audited_cycle(
            producer=workstream,
            auditor=workstream,
            inputs=inputs or {},
            policy=policy,
            on_round=on_round,
        )
        self._harvest(result)
        return result

    def _harvest(self, result: CycleResult) -> int:
        """Write a finished stage's durable output into the ledger."""
        added = self.ledger.add_learnings(result.stage, result.learnings())
        self.ledger.remember_ids(result.stage, _ids(result.artifact))
        if added:
            self.report(f"[{result.stage}] {added} new learning(s) recorded for future runs")
        return added

    # -- the cycle ---------------------------------------------------------

    def should_recycle(self, outreach: CycleResult, cycle: int) -> tuple[bool, str]:
        """Decide whether a weak campaign means the prospect list needs redoing.

        Only upstream-shaped failures justify the cost of another cycle. A
        campaign that failed on its own copy is the outreach loop's problem and
        was already given its rounds.
        """
        if cycle >= self.settings.max_cycles:
            return False, f"cycle budget of {self.settings.max_cycles} spent"

        score = outreach.outcome.final_score
        if score >= self.settings.recycle_score_floor and not outreach.outcome.escalated:
            return False, f"campaign scored {score:.1f}; no upstream rework needed"

        upstream_dimensions = {"personalisation", "icp_fit", "trigger_quality", "segment"}
        upstream_findings = [
            f
            for f in outreach.audit.findings
            if f.dimension.lower() in upstream_dimensions
            and f.severity in ("blocker", "major")
        ]
        if not upstream_findings:
            return False, (
                f"campaign scored {score:.1f} but the findings are about the copy, "
                "not the list; another prospecting cycle would not fix it"
            )
        return True, (
            f"campaign scored {score:.1f} with {len(upstream_findings)} finding(s) "
            "pointing at the prospect list; re-running prospecting with that feedback"
        )

    def run(self, cycles: Optional[int] = None) -> RunResult:
        """Run funding once, then clients -> outreach until good enough or out of budget."""
        budget = cycles if cycles is not None else self.settings.max_cycles
        result = RunResult(run_id=self.run_id)

        funding = self.run_stage("funding")
        result.funding = funding.artifact
        result.outcomes.append(funding.outcome)
        if funding.outcome.escalated:
            result.escalations.append(f"funding: {funding.outcome.reason}")

        upstream_feedback = "None yet — first cycle."
        clients: Optional[CycleResult] = None
        outreach: Optional[CycleResult] = None

        for cycle in range(1, max(budget, 1) + 1):
            result.cycles_run = cycle
            self.report(f"=== cycle {cycle} of {budget} ===")

            clients = self.run_stage(
                "clients",
                {"feedback": upstream_feedback, "previous_json": dump_artifact(result.prospects)},
            )
            result.prospects = clients.artifact

            outreach = self.run_stage(
                "outreach",
                {
                    "approved_prospects": dump_artifact(clients.artifact),
                    "approved_funding": dump_artifact(funding.artifact),
                },
            )
            result.campaign = outreach.artifact

            recycle, reason = self.should_recycle(outreach, cycle)
            self.report(f"[cycle {cycle}] {reason}")
            if not recycle:
                break
            upstream_feedback = (
                "The campaign built from your last list scored "
                f"{outreach.outcome.final_score:.1f}. The campaign auditor traced the "
                "problem to the list itself:\n" + outreach.audit.feedback_brief()
            )

        for stage_result in (clients, outreach):
            if stage_result is None:
                continue
            result.outcomes.append(stage_result.outcome)
            if stage_result.outcome.escalated:
                result.escalations.append(
                    f"{stage_result.stage}: {stage_result.outcome.reason}"
                )

        result.learnings_added = sum(
            len(r.learnings()) for r in (funding, clients, outreach) if r is not None
        )
        self.ledger.record_run(self.run_id, result.summary())
        self.ledger.save()
        self.report(
            f"run {self.run_id} complete — "
            + ("needs human review" if result.needs_human else "all stages accepted")
        )
        return result

    # -- persistence -------------------------------------------------------

    def write_outputs(self, result: RunResult) -> dict[str, str]:
        """Save the three artifacts and the run summary as JSON for humans."""
        target = output_dir() / result.run_id
        target.mkdir(parents=True, exist_ok=True)
        written: dict[str, str] = {}
        for name, artifact in (
            ("funding", result.funding),
            ("prospects", result.prospects),
            ("campaign", result.campaign),
        ):
            if artifact is None:
                continue
            path = target / f"{name}.json"
            path.write_text(dump_artifact(artifact, limit=10**9) + "\n", encoding="utf-8")
            written[name] = str(path)
        summary_path = target / "run.json"
        summary_path.write_text(
            json.dumps(result.summary(), indent=2, default=str) + "\n", encoding="utf-8"
        )
        written["summary"] = str(summary_path)
        return written
