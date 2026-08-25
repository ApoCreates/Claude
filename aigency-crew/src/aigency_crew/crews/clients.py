"""Workstream 2 — client pipeline (prospector + data-integrity auditor)."""

from __future__ import annotations

from ..settings import Settings
from ..guardrails import require_evidence, require_min_items
from ..ledger import Ledger
from ..models import ProspectList
from ..tools.crew_tools import score_prospect
from .base import StageSpec, Workstream

STAGE = "clients"


def clients_workstream(
    settings: Settings, ledger: Ledger, verbose: bool = True
) -> Workstream:
    # Unlike funding, the count floor here is the full target: the revision
    # task requires dropped accounts to be *replaced*, so a shrinking list is
    # a sign the round was spent deleting rather than researching.
    spec = StageSpec(
        stage=STAGE,
        producer_key="client_prospector",
        auditor_key="prospect_auditor",
        produce_task="build_client_list",
        audit_task="audit_client_list",
        revise_task="revise_client_list",
        artifact_model=ProspectList,
        producer_tools=[score_prospect],
        auditor_tools=[score_prospect],
        producer_guardrails=[
            require_min_items("prospects", settings.prospect_target_count),
            require_evidence("prospects"),
        ],
    )
    return Workstream(spec, settings, ledger, verbose=verbose)
