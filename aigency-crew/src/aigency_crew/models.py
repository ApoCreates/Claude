"""Structured outputs every agent in the engine must produce.

Free text cannot be audited mechanically. Every producer returns one of the
artifact models here and every auditor returns an :class:`AuditReport`, which
is what makes the loop in :mod:`aigency_crew.loops` able to decide on its own
whether another round is worth running.
"""

from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Severity = Literal["blocker", "major", "minor"]
Verdict = Literal["pass", "revise", "reject"]


class Evidence(BaseModel):
    """A claim's receipt. No source, no claim."""

    source_name: str = Field(..., description="Publisher, e.g. 'ADIO' or 'Hub71'.")
    source_url: str = Field(..., description="Direct URL the fact was read from.")
    retrieved_on: Optional[date] = Field(
        None, description="Date the agent actually opened the page."
    )
    quote: str = Field(
        "",
        max_length=600,
        description="Short verbatim snippet supporting the claim.",
    )
    confidence: float = Field(
        0.5, ge=0.0, le=1.0, description="0 = unverified recall, 1 = read it directly."
    )

    @field_validator("source_url")
    @classmethod
    def _must_look_like_a_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError(f"source_url must be an http(s) URL, got {v!r}")
        return v


# --------------------------------------------------------------------------
# Agent 1 — funding and grants
# --------------------------------------------------------------------------

Instrument = Literal[
    "grant",
    "matching_fund",
    "prize",
    "accelerator",
    "equity",
    "soft_loan",
    "tax_credit",
    "in_kind",
    "sponsorship",
    "procurement",
    "residency",
]


class FundingOpportunity(BaseModel):
    id: str = Field(..., description="Stable slug, e.g. 'adio-innovation-2026'.")
    name: str
    funder: str
    instrument: Instrument
    geography: str = Field(..., description="Where the applicant must be based/operate.")
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    currency: str = "AED"
    deadline: Optional[date] = None
    rolling: bool = Field(False, description="True when applications are always open.")
    eligibility_summary: str
    disqualifiers: list[str] = Field(
        default_factory=list,
        description="Concrete reasons we would be rejected. Be honest here.",
    )
    why_hidden: str = Field(
        ...,
        description=(
            "What makes this non-obvious: unlisted, newly launched, mis-tagged "
            "sector, low applicant volume, or an angle competitors miss."
        ),
    )
    fit_rationale: str = Field(..., description="Why this specific studio wins it.")
    effort_days: float = Field(
        ..., ge=0, description="Realistic person-days to assemble a submission."
    )
    win_probability: float = Field(..., ge=0.0, le=1.0)
    next_action: str = Field(..., description="The single next physical step.")
    evidence: list[Evidence] = Field(default_factory=list)

    @property
    def expected_value(self) -> float:
        """Probability-weighted award value. Used to rank effort against payoff."""
        ceiling = self.amount_max or self.amount_min or 0.0
        return ceiling * self.win_probability


class FundingReport(BaseModel):
    run_id: str = ""
    opportunities: list[FundingOpportunity] = Field(default_factory=list)
    searched_but_rejected: list[str] = Field(
        default_factory=list,
        description="Programs looked at and dropped, with the reason. Feeds the ledger.",
    )
    coverage_notes: str = ""

    def ids(self) -> list[str]:
        return [o.id for o in self.opportunities]


# --------------------------------------------------------------------------
# Agent 2 — client pipeline
# --------------------------------------------------------------------------


class Contact(BaseModel):
    name: str
    role: str
    public_email: Optional[str] = Field(
        None, description="Business address from a public/company source only."
    )
    linkedin: Optional[str] = None
    source_url: str = Field(..., description="Where this contact was found publicly.")


class Prospect(BaseModel):
    id: str = Field(..., description="Stable slug, e.g. 'acme-fnb-ae'.")
    company: str
    website: str
    country: str
    sector: str
    size_band: Literal["micro", "smb", "mid_market", "enterprise", "government"]
    services_matched: list[str] = Field(
        ..., min_length=1, description="Which of our offerings this account needs."
    )
    trigger_event: str = Field(
        ...,
        description="The dated 'why now' — funding round, new hire, launch, mandate.",
    )
    trigger_date: Optional[date] = None
    budget_band: Literal["unknown", "under_50k", "50k_150k", "150k_500k", "over_500k"] = (
        "unknown"
    )
    fit_score: float = Field(0.0, ge=0.0, le=100.0)
    contacts: list[Contact] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    disqualifiers: list[str] = Field(default_factory=list)


class ProspectList(BaseModel):
    run_id: str = ""
    prospects: list[Prospect] = Field(default_factory=list)
    excluded: list[str] = Field(
        default_factory=list, description="Company + reason for exclusion."
    )
    coverage_notes: str = ""

    def ids(self) -> list[str]:
        return [p.id for p in self.prospects]


# --------------------------------------------------------------------------
# Agent 3 — outreach and content
# --------------------------------------------------------------------------


class EmailAsset(BaseModel):
    prospect_id: str
    step: int = Field(..., ge=1, description="Position in the sequence.")
    send_offset_days: int = Field(..., ge=0)
    subject: str = Field(..., max_length=90)
    preview_text: str = Field("", max_length=120)
    body: str
    personalisation_source: str = Field(
        ..., description="The evidence URL the personalised line came from."
    )
    call_to_action: str
    opt_out_line: str = Field(
        ..., description="Required. Unsubscribe/opt-out sentence in the footer."
    )


class CallScript(BaseModel):
    prospect_id: str
    objective: str
    opener: str
    discovery_questions: list[str] = Field(..., min_length=3)
    objection_handling: dict[str, str] = Field(default_factory=dict)
    close: str
    voicemail: str = ""


class SocialPost(BaseModel):
    channel: Literal["linkedin", "instagram", "x", "tiktok", "youtube", "newsletter"]
    pillar: str = Field(..., description="Content pillar this post serves.")
    publish_offset_days: int = Field(..., ge=0)
    hook: str
    body: str
    cta: str
    asset_brief: str = Field("", description="What the designer/editor must produce.")
    hashtags: list[str] = Field(default_factory=list)


class Campaign(BaseModel):
    run_id: str = ""
    name: str
    thesis: str = Field(..., description="The one bet this campaign is making.")
    segment: str = Field(..., description="Which slice of the prospect list it targets.")
    emails: list[EmailAsset] = Field(default_factory=list)
    calls: list[CallScript] = Field(default_factory=list)
    social: list[SocialPost] = Field(default_factory=list)
    success_metrics: dict[str, float] = Field(
        default_factory=dict,
        description="Target reply rate, meeting rate, etc. Checked next cycle.",
    )
    compliance_notes: str = ""


# --------------------------------------------------------------------------
# Auditors
# --------------------------------------------------------------------------


class AuditFinding(BaseModel):
    severity: Severity
    dimension: str = Field(..., description="e.g. 'evidence', 'eligibility', 'brand'.")
    item_ref: str = Field("", description="id of the offending opportunity/prospect/asset.")
    issue: str
    fix: str = Field(..., description="Actionable instruction the producer can execute.")


class AuditReport(BaseModel):
    """An auditor's verdict on one artifact.

    ``score`` and ``findings`` drive the loop; ``learnings`` outlive the run and
    are replayed into the next one via the ledger.
    """

    stage: str = ""
    round: int = 0
    verdict: Verdict = "revise"
    score: float = Field(0.0, ge=0.0, le=100.0)
    dimension_scores: dict[str, float] = Field(default_factory=dict)
    findings: list[AuditFinding] = Field(default_factory=list)
    kept_ids: list[str] = Field(default_factory=list)
    dropped_ids: list[str] = Field(default_factory=list)
    learnings: list[str] = Field(
        default_factory=list,
        description="Durable rules for future runs, not fixes for this one.",
    )
    summary: str = ""

    @property
    def blockers(self) -> list[AuditFinding]:
        return [f for f in self.findings if f.severity == "blocker"]

    def feedback_brief(self, limit: int = 12) -> str:
        """Findings rendered as the revision instructions handed back to the producer."""
        order = {"blocker": 0, "major": 1, "minor": 2}
        ranked = sorted(self.findings, key=lambda f: order[f.severity])[:limit]
        if not ranked:
            return "No findings recorded."
        lines = [
            f"- [{f.severity.upper()}] ({f.dimension}) {f.item_ref or 'general'}: "
            f"{f.issue} -> FIX: {f.fix}"
            for f in ranked
        ]
        return "\n".join(lines)


class CycleOutcome(BaseModel):
    """What one produce/audit loop settled on, for the run log and the ledger."""

    stage: str
    rounds_run: int
    accepted: bool
    escalated: bool
    final_score: float
    reason: str
    score_history: list[float] = Field(default_factory=list)
