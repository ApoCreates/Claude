"""Workstream 3 — outreach and content (campaign architect + brand/compliance auditor)."""

from __future__ import annotations

from ..settings import Settings
from ..guardrails import (
    require_min_items,
    require_opt_out,
    require_personalisation_sources,
)
from ..ledger import Ledger
from ..models import Campaign
from ..tools.crew_tools import recall_campaign_performance
from .base import StageSpec, Workstream

STAGE = "outreach"


def outreach_workstream(
    settings: Settings, ledger: Ledger, verbose: bool = True
) -> Workstream:
    # This is the only workstream whose output reaches people outside the
    # studio, so the mechanical gate is the strictest: no draft without an
    # opt-out line and a traceable source for every personalised opener even
    # reaches the auditor.
    spec = StageSpec(
        stage=STAGE,
        producer_key="campaign_architect",
        auditor_key="campaign_auditor",
        produce_task="build_campaign",
        audit_task="audit_campaign",
        revise_task="revise_campaign",
        artifact_model=Campaign,
        producer_tools=[recall_campaign_performance],
        auditor_tools=[recall_campaign_performance],
        producer_guardrails=[
            require_min_items("emails", 3),
            require_min_items("social", 3),
            require_opt_out(),
            require_personalisation_sources(),
        ],
    )
    return Workstream(spec, settings, ledger, verbose=verbose)
