"""CrewAI tool wrappers.

Everything here is a thin shell over deterministic Python in
:mod:`aigency_crew.tools.scoring` and :mod:`aigency_crew.ledger`. Agents get to
*call* arithmetic instead of performing it, which is the difference between a
ranking you can defend and a ranking that changes every time you rerun.

This module imports CrewAI; the pure logic modules deliberately do not.
"""

from __future__ import annotations

import json
import os
from typing import Any

from crewai.tools import tool

from ..ledger import Ledger
from .scoring import grant_fit_score, icp_fit_score

_LEDGER_PATH = os.getenv("AIGENCY_LEDGER", "state/ledger.json")


def _parse(payload: str, what: str) -> Any:
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"{what} must be valid JSON. Parser said: {exc}. "
            "Pass the object exactly as it appears in your draft, no prose around it."
        ) from exc


@tool("Score funding opportunity")
def score_funding_opportunity(opportunity_json: str) -> str:
    """Score one funding opportunity 0-100 on payoff, winnability, effort, timing and
    evidence. Input: a JSON object with amount_max, win_probability, effort_days,
    deadline, rolling, evidence[], disqualifiers[], why_hidden. Returns the total, the
    band (pursue/shortlist/watch/drop) and the per-component breakdown, so you can see
    which factor is holding the score down."""
    data = _parse(opportunity_json, "opportunity_json")
    return json.dumps(grant_fit_score(data), default=str)


@tool("Score prospect fit")
def score_prospect(payload_json: str) -> str:
    """Score one prospect against the ideal customer profile. Input: a JSON object
    {"prospect": {...}, "icp": {"sectors": [], "geographies": [], "size_bands": [],
    "services": []}}. Returns total, band and per-component breakdown covering sector,
    geography, size, service fit, trigger recency and contactability."""
    data = _parse(payload_json, "payload_json")
    prospect = data.get("prospect", data)
    icp = data.get("icp", {})
    return json.dumps(icp_fit_score(prospect, icp), default=str)


@tool("Check already seen")
def check_already_seen(payload_json: str) -> str:
    """Check candidate ids against everything this engine has surfaced in previous runs.
    Input: {"stage": "funding", "ids": ["adio-innovation-2026", ...]}. Returns which ids
    are new and which were already delivered. Use it before finalising a list: repeating
    last cycle's names is the most common way these reports lose their value."""
    data = _parse(payload_json, "payload_json")
    stage = str(data.get("stage", "")).strip()
    ids = [str(i) for i in data.get("ids", [])]
    ledger = Ledger.load(_LEDGER_PATH)
    novel = ledger.novel(stage, ids)
    return json.dumps(
        {
            "new": novel,
            "already_delivered": [i for i in ids if i not in novel],
            "total_seen_for_stage": len(ledger.seen(stage)),
        }
    )


@tool("Recall prior learnings")
def recall_learnings(stage: str) -> str:
    """Read the durable rules previous audits wrote for a stage ("funding", "clients" or
    "outreach"). These are standing instructions from your own auditor — following them
    is cheaper than being corrected again."""
    ledger = Ledger.load(_LEDGER_PATH)
    return ledger.briefing(stage.strip(), limit=25)


@tool("Recall campaign performance")
def recall_campaign_performance(_: str = "") -> str:
    """Read real reply/meeting/win rates from campaigns already sent. This is the only
    non-agent-generated signal in the system: prefer it over any assumption about what
    channel or segment works."""
    ledger = Ledger.load(_LEDGER_PATH)
    return ledger.performance_brief()


def research_tools() -> list:
    """Search tools, when the environment can actually reach the web.

    Without ``SERPER_API_KEY`` the crews still run — the agents are told in
    their task prompts to work from ``knowledge/`` alone and to mark every
    claim unverified, which the auditors then score down. A quiet degradation
    to confident guessing would be far worse than a visibly thin report.
    """
    if not os.getenv("SERPER_API_KEY"):
        return []
    try:
        from crewai_tools import ScrapeWebsiteTool, SerperDevTool
    except ImportError:
        return []
    return [SerperDevTool(), ScrapeWebsiteTool()]


def has_web_access() -> bool:
    return bool(research_tools())


SHARED_TOOLS = [recall_learnings, check_already_seen]
