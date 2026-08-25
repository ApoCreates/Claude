"""Prompt inputs: everything the YAML task templates interpolate.

Kept out of the crew layer so the "is every placeholder filled?" question can
be answered by a test rather than by a KeyError halfway through a paid run.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

from .settings import CONFIG_DIR, Settings, load_company_profile, load_icp
from .ledger import Ledger

#: Values that exist for every task whether or not it uses them. Anything a
#: task template references must resolve, so per-call keys get placeholder
#: defaults rather than being left out.
OPTIONAL_DEFAULTS: dict[str, Any] = {
    "round": 1,
    "feedback": "None yet.",
    "previous_json": "None available.",
    "draft_json": "None available.",
    "approved_prospects": "None available.",
    "approved_funding": "None available.",
}


def placeholders_in_tasks(path: Path | None = None) -> set[str]:
    """Every ``{placeholder}`` used anywhere in tasks.yaml."""
    path = path or CONFIG_DIR / "tasks.yaml"
    return set(re.findall(r"\{(\w+)\}", path.read_text(encoding="utf-8")))


def base_inputs(settings: Settings, ledger: Ledger, stage: str) -> dict[str, Any]:
    """Grounding shared by every task in a stage."""
    return {
        "today": date.today().isoformat(),
        "region": settings.region,
        "horizon_months": settings.horizon_months,
        "funding_target_count": settings.funding_target_count,
        "prospect_target_count": settings.prospect_target_count,
        "campaign_goal": settings.campaign_goal,
        "company_profile": load_company_profile(),
        "icp_json": json.dumps(load_icp(), indent=2),
        "learnings": ledger.briefing(stage),
        "performance": ledger.performance_brief(),
        "seen_ids": ", ".join(ledger.seen(stage)[-80:]) or "nothing yet",
    }


def web_access_note(has_web: bool) -> str:
    if has_web:
        return "You have live web search. Verify everything you can and cite what you read."
    return (
        "NO web search is available in this run. Work only from the knowledge files "
        "and your own recall, mark every claim unverified with low evidence "
        "confidence, and say so in the coverage notes. Do not present recalled "
        "detail as confirmed."
    )


def full_inputs(
    settings: Settings,
    ledger: Ledger,
    stage: str,
    *,
    has_web: bool = False,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Base grounding + defaults + per-call values, with every placeholder filled."""
    return {
        **base_inputs(settings, ledger, stage),
        "web_access": web_access_note(has_web),
        **OPTIONAL_DEFAULTS,
        **(extra or {}),
    }
