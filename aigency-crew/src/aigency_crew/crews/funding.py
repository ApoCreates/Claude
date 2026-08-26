"""Workstream 1 — hidden-gem funding and grants (scout + eligibility auditor)."""

from __future__ import annotations

from ..settings import Settings
from ..guardrails import require_evidence, require_min_items
from ..ledger import Ledger
from ..models import FundingReport
from ..tools.crew_tools import score_funding_opportunity
from .base import StageSpec, Workstream

STAGE = "funding"


def funding_workstream(
    settings: Settings, ledger: Ledger, verbose: bool = True
) -> Workstream:
    # The count guardrail is deliberately looser than the brief's target. The
    # revision task tells the scout to cut what it cannot evidence, and a hard
    # floor at the full target would push it to pad the list back out with
    # weak items — exactly the behaviour the audit exists to prevent.
    floor = max(3, settings.funding_target_count // 2)

    spec = StageSpec(
        stage=STAGE,
        producer_key="funding_scout",
        auditor_key="funding_auditor",
        produce_task="find_funding",
        audit_task="audit_funding",
        revise_task="revise_funding",
        artifact_model=FundingReport,
        producer_tools=[score_funding_opportunity],
        auditor_tools=[score_funding_opportunity],
        producer_guardrails=[
            require_min_items("opportunities", floor),
            require_evidence("opportunities"),
        ],
    )
    return Workstream(spec, settings, ledger, verbose=verbose)
