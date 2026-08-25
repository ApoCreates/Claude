"""Scripted stand-ins for the six agents, for ``--dry-run`` and for tests.

These produce fixed, obviously fictional artifacts and a scripted sequence of
audit scores. Nothing here calls a model or the network, which makes it the
fastest way to watch the loop mechanics — accept, revise, stall, escalate,
recycle — without spending a token or waiting on research.

The example programs and companies are invented placeholders. They are named
so that nobody could mistake them for real opportunities.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Optional

from .models import (
    AuditFinding,
    AuditReport,
    Campaign,
    Contact,
    EmailAsset,
    Evidence,
    FundingOpportunity,
    FundingReport,
    Prospect,
    ProspectList,
    SocialPost,
    CallScript,
)


def _soon(days: int) -> date:
    return date.today() + timedelta(days=days)


def sample_funding(round_number: int = 1) -> FundingReport:
    evidence = [
        Evidence(
            source_name="Example Funder (fictional)",
            source_url="https://example.org/programmes/creative-ai",
            retrieved_on=date.today(),
            quote="Applications open to studios registered in the region.",
            confidence=0.9 if round_number > 1 else 0.5,
        )
    ]
    return FundingReport(
        run_id=f"demo-r{round_number}",
        opportunities=[
            FundingOpportunity(
                id="example-creative-ai-fund",
                name="Example Creative AI Fund (fictional)",
                funder="Example Funder",
                instrument="grant",
                geography="United Arab Emirates",
                amount_min=100_000,
                amount_max=400_000,
                deadline=_soon(45),
                eligibility_summary="Registered studio, under 50 staff, regional delivery.",
                disqualifiers=[] if round_number > 1 else ["entity facts unconfirmed"],
                why_hidden="Listed only in a ministry PDF and tagged under manufacturing, "
                "so creative studios rarely find it.",
                fit_rationale="Bilingual AI production is squarely in scope.",
                effort_days=6,
                win_probability=0.35,
                next_action="Request the eligibility annex from the programme office.",
                evidence=evidence,
            ),
            FundingOpportunity(
                id="example-compute-credits",
                name="Example Compute Credits (fictional)",
                funder="Example Cloud",
                instrument="in_kind",
                geography="Global",
                amount_max=50_000,
                currency="USD",
                rolling=True,
                eligibility_summary="Startups building on the platform.",
                why_hidden="Offered through partner managers rather than a public page.",
                fit_rationale="Directly offsets rendering and inference cost.",
                effort_days=1,
                win_probability=0.6,
                next_action="Ask our partner manager to nominate us.",
                evidence=evidence,
            ),
        ],
        searched_but_rejected=["Example National Grant — closed to service businesses"],
        coverage_notes=f"Demo fixture, revision round {round_number}.",
    )


def sample_prospects(round_number: int = 1) -> ProspectList:
    evidence = [
        Evidence(
            source_name="Example Newswire (fictional)",
            source_url="https://example.com/news/series-b",
            retrieved_on=date.today(),
            quote="The group appointed a new head of brand this month.",
            confidence=0.8,
        )
    ]
    return ProspectList(
        run_id=f"demo-r{round_number}",
        prospects=[
            Prospect(
                id="example-hospitality-group",
                company="Example Hospitality Group (fictional)",
                website="https://example.com",
                country="United Arab Emirates",
                sector="hospitality",
                size_band="mid_market",
                services_matched=["ai content production", "arabic localisation"],
                trigger_event="Appointed a new head of brand and announced two venue openings.",
                trigger_date=date.today() - timedelta(days=14),
                budget_band="150k_500k",
                fit_score=82.0,
                contacts=[
                    Contact(
                        name="A. Example",
                        role="Head of Brand",
                        linkedin="https://linkedin.com/in/example",
                        source_url="https://example.com/about/team",
                    )
                ],
                evidence=evidence,
            ),
            Prospect(
                id="example-retail-co",
                company="Example Retail Co (fictional)",
                website="https://example.net",
                country="Saudi Arabia",
                sector="retail",
                size_band="enterprise",
                services_matched=["ai content production", "creative operations"],
                trigger_event="Published a digital transformation mandate with a spend deadline.",
                trigger_date=date.today() - timedelta(days=40),
                budget_band="over_500k",
                fit_score=76.0,
                contacts=[
                    Contact(
                        name="B. Example",
                        role="Marketing Director",
                        source_url="https://example.net/leadership",
                    )
                ],
                evidence=evidence,
            ),
        ],
        excluded=["Example Competitor Studio — direct competitor"],
        coverage_notes=f"Demo fixture, revision round {round_number}.",
    )


def sample_campaign(round_number: int = 1) -> Campaign:
    opt_out = "Reply STOP and I will remove you from this list immediately."
    return Campaign(
        run_id=f"demo-r{round_number}",
        name="Venue Openings, Bilingual Content (demo)",
        thesis="Groups opening venues this quarter need Arabic-first launch content faster "
        "than a traditional studio can produce it.",
        segment="Hospitality and retail groups with a dated launch in the next 90 days",
        emails=[
            EmailAsset(
                prospect_id="example-hospitality-group",
                step=step,
                send_offset_days=offset,
                subject=subject,
                body="Short, specific, about the reader. Demo placeholder body.",
                personalisation_source="https://example.com/news/series-b",
                call_to_action="Worth 20 minutes next week?",
                opt_out_line=opt_out,
            )
            for step, offset, subject in (
                (1, 0, "Two openings, one content pipeline"),
                (2, 4, "The Arabic-first version, in half the time"),
                (3, 11, "Closing the loop"),
            )
        ],
        calls=[
            CallScript(
                prospect_id="example-hospitality-group",
                objective="Book a 20-minute discovery call",
                opener="Calling about the two openings you announced this month.",
                discovery_questions=[
                    "Who is producing launch content for both venues?",
                    "How is the Arabic version being handled today?",
                    "What is the deadline you are working back from?",
                ],
                objection_handling={"We have an agency": "Then this is overflow, not replacement."},
                close="Shall I send two slots for next week?",
                voicemail="Demo placeholder voicemail.",
            )
        ],
        social=[
            SocialPost(
                channel=channel,
                pillar="Proof of production speed",
                publish_offset_days=offset,
                hook=hook,
                body="Demo placeholder body.",
                cta="See the full breakdown.",
                asset_brief="15-second cutdown, Arabic and English titles.",
            )
            for channel, offset, hook in (
                ("linkedin", 1, "A launch film in four days, start to finish."),
                ("instagram", 3, "Same brief, Arabic-first."),
                ("linkedin", 8, "What it costs when the pipeline is AI-native."),
            )
        ],
        success_metrics={"reply_rate": 0.08, "meeting_rate": 0.03, "meetings": 10},
        compliance_notes="Opt-out in every email; contacts from public professional sources.",
    )


@dataclass
class ScriptedWorkstream:
    """A fake producer/auditor pair that follows a fixed script of audit scores.

    ``scores`` is read one entry per round; the last entry repeats if the loop
    runs longer. ``blocker_rounds`` lists the rounds that should carry a
    blocker finding, which is how the demo shows a blocker overriding a
    passing score.
    """

    stage: str
    artifact_factory: Any
    scores: list[float] = field(default_factory=lambda: [65.0, 84.0])
    blocker_rounds: tuple[int, ...] = (1,)
    dimension: str = "evidence"
    learnings: list[str] = field(default_factory=list)
    produced: int = 0
    audited: int = 0

    def produce(self, inputs: dict) -> Any:
        self.produced += 1
        return self.artifact_factory(self.produced)

    def revise(self, previous: Any, audit: AuditReport, inputs: dict) -> Any:
        self.produced += 1
        return self.artifact_factory(self.produced)

    def audit(self, artifact: Any, inputs: dict, round_number: int) -> AuditReport:
        self.audited += 1
        score = self.scores[min(round_number, len(self.scores)) - 1]
        findings = []
        if round_number in self.blocker_rounds:
            findings.append(
                AuditFinding(
                    severity="blocker",
                    dimension=self.dimension,
                    item_ref="demo-item",
                    issue="Demo blocker: a claim with no source attached.",
                    fix="Attach the source URL each fact was read from, or drop the item.",
                )
            )
        findings.append(
            AuditFinding(
                severity="minor",
                dimension=self.dimension,
                item_ref="demo-item",
                issue="Demo nit: the next action could be more specific.",
                fix="Name the person or office to contact.",
            )
        )
        return AuditReport(
            stage=self.stage,
            round=round_number,
            verdict="revise" if findings and findings[0].severity == "blocker" else "pass",
            score=score,
            dimension_scores={self.dimension: score},
            findings=findings,
            learnings=self.learnings if round_number == 1 else [],
            summary=f"Demo audit for {self.stage}, round {round_number}.",
        )


def demo_workstreams(
    funding_scores: Optional[list[float]] = None,
    clients_scores: Optional[list[float]] = None,
    outreach_scores: Optional[list[float]] = None,
) -> dict[str, ScriptedWorkstream]:
    """Three scripted pairs whose default scripts show accept-after-one-revision."""
    return {
        "funding": ScriptedWorkstream(
            stage="funding",
            artifact_factory=sample_funding,
            scores=funding_scores or [64.0, 86.0],
            learnings=[
                "Confirm the entity's licence type before scoring eligibility — "
                "half the shortlist depends on it."
            ],
        ),
        "clients": ScriptedWorkstream(
            stage="clients",
            artifact_factory=sample_prospects,
            scores=clients_scores or [71.0, 83.0],
            dimension="trigger_quality",
            learnings=["An undated trigger event is not a trigger event."],
        ),
        "outreach": ScriptedWorkstream(
            stage="outreach",
            artifact_factory=sample_campaign,
            scores=outreach_scores or [69.0, 88.0],
            dimension="personalisation",
            learnings=["Every personalised opener must name the URL it came from."],
        ),
    }
