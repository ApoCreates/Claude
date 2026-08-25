"""CrewAI Flow view of the engine.

:class:`~aigency_crew.engine.GrowthEngine` already runs the whole sequence and
is what the CLI uses by default. This module exposes the same sequence as a
CrewAI ``Flow`` so the phases show up in CrewAI's own tooling — event stream,
token accounting, and ``flow.plot()`` for a diagram of the graph.

One honest note on the graph. CrewAI flows are directed forward: a ``@router``
can branch, but it cannot draw an edge back to a step that already ran. The
cycle loop is therefore a bounded ``while`` inside :meth:`rerun_pipeline`
rather than a back-edge in the diagram. The looping behaviour is identical;
only its rendering differs.
"""

from __future__ import annotations

from typing import Any, Optional

from crewai.flow.flow import Flow, listen, router, start
from pydantic import BaseModel

from .settings import Settings, load_settings, ledger_path
from .crews import clients_workstream, funding_workstream, outreach_workstream
from .engine import GrowthEngine, RunResult, dump_artifact
from .ledger import Ledger


class GrowthState(BaseModel):
    """Flow-visible state. The artifacts themselves live on the engine's RunResult."""

    run_id: str = ""
    cycle: int = 0
    max_cycles: int = 2
    funding_score: float = 0.0
    clients_score: float = 0.0
    outreach_score: float = 0.0
    escalations: list[str] = []
    decisions: list[str] = []


def build_engine(
    settings: Optional[Settings] = None,
    ledger: Optional[Ledger] = None,
    verbose: bool = True,
    reporter=None,
) -> GrowthEngine:
    """Wire the three real CrewAI workstreams into an engine."""
    settings = settings or load_settings()
    ledger = ledger or Ledger.load(ledger_path())
    return GrowthEngine(
        settings=settings,
        ledger=ledger,
        workstreams={
            "funding": funding_workstream(settings, ledger, verbose=verbose),
            "clients": clients_workstream(settings, ledger, verbose=verbose),
            "outreach": outreach_workstream(settings, ledger, verbose=verbose),
        },
        reporter=reporter or (lambda msg: print(msg)),
    )


class AigencyGrowthFlow(Flow[GrowthState]):
    """funding -> clients -> outreach, with a bounded rework cycle at the end."""

    def __init__(self, engine: Optional[GrowthEngine] = None, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.engine = engine or build_engine()
        self.result = RunResult(run_id=self.engine.run_id)
        self._funding = None
        self._clients = None
        self._outreach = None
        self._upstream_feedback = "None yet — first cycle."

    # -- phases ------------------------------------------------------------

    @start()
    def research_funding(self) -> str:
        self.state.run_id = self.engine.run_id
        self.state.max_cycles = self.engine.settings.max_cycles
        self.state.cycle = 1

        self._funding = self.engine.run_stage("funding")
        self.result.funding = self._funding.artifact
        self.result.outcomes.append(self._funding.outcome)
        self.state.funding_score = self._funding.outcome.final_score
        if self._funding.outcome.escalated:
            self.state.escalations.append(f"funding: {self._funding.outcome.reason}")
        return "funding complete"

    @listen(research_funding)
    def build_pipeline(self, _: str) -> str:
        self._clients = self.engine.run_stage(
            "clients",
            {
                "feedback": self._upstream_feedback,
                "previous_json": dump_artifact(self.result.prospects),
            },
        )
        self.result.prospects = self._clients.artifact
        self.state.clients_score = self._clients.outcome.final_score
        return "pipeline complete"

    @listen(build_pipeline)
    def build_campaign(self, _: str) -> str:
        self._outreach = self.engine.run_stage(
            "outreach",
            {
                "approved_prospects": dump_artifact(self.result.prospects),
                "approved_funding": dump_artifact(self.result.funding),
            },
        )
        self.result.campaign = self._outreach.artifact
        self.state.outreach_score = self._outreach.outcome.final_score
        return "campaign complete"

    # -- the decision ------------------------------------------------------

    @router(build_campaign)
    def review_cycle(self, _: str) -> str:
        recycle, reason = self.engine.should_recycle(self._outreach, self.state.cycle)
        self.state.decisions.append(f"cycle {self.state.cycle}: {reason}")
        self.engine.report(f"[cycle {self.state.cycle}] {reason}")
        return "recycle" if recycle else "complete"

    @listen("recycle")
    def rerun_pipeline(self) -> RunResult:
        """Re-prospect with the campaign auditor's findings, then rebuild the campaign."""
        while self.state.cycle < self.state.max_cycles:
            self.state.cycle += 1
            self._upstream_feedback = (
                "The campaign built from your last list scored "
                f"{self._outreach.outcome.final_score:.1f}. The campaign auditor traced "
                "the problem to the list itself:\n"
                + self._outreach.audit.feedback_brief()
            )
            self.build_pipeline("recycled")
            self.build_campaign("recycled")

            recycle, reason = self.engine.should_recycle(self._outreach, self.state.cycle)
            self.state.decisions.append(f"cycle {self.state.cycle}: {reason}")
            self.engine.report(f"[cycle {self.state.cycle}] {reason}")
            if not recycle:
                break
        return self._finalise()

    @listen("complete")
    def wrap_up(self) -> RunResult:
        return self._finalise()

    # -- wrap up -----------------------------------------------------------

    def _finalise(self) -> RunResult:
        for stage_result in (self._clients, self._outreach):
            if stage_result is None:
                continue
            self.result.outcomes.append(stage_result.outcome)
            if stage_result.outcome.escalated:
                self.result.escalations.append(
                    f"{stage_result.stage}: {stage_result.outcome.reason}"
                )
        self.result.cycles_run = self.state.cycle
        self.result.learnings_added = sum(
            len(r.learnings())
            for r in (self._funding, self._clients, self._outreach)
            if r is not None
        )
        self.state.escalations = list(self.result.escalations)
        self.engine.ledger.record_run(self.result.run_id, self.result.summary())
        self.engine.ledger.save()
        return self.result
