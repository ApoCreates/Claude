"""The mechanical gate that runs before the auditor agent, and the schemas
that make the gate possible."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from aigency_crew.demo import sample_campaign, sample_funding, sample_prospects
from aigency_crew.guardrails import (
    require_audit_fixes,
    require_evidence,
    require_min_items,
    require_opt_out,
    require_personalisation_sources,
)
from aigency_crew.models import AuditFinding, AuditReport, Evidence, FundingOpportunity


class TestMinItems:
    def test_passes_when_the_brief_is_met(self):
        ok, _ = require_min_items("opportunities", 2)(sample_funding())
        assert ok

    def test_fails_with_a_count_the_producer_can_act_on(self):
        ok, message = require_min_items("opportunities", 8)(sample_funding())
        assert not ok
        assert "Only 2" in message and "at least 8" in message

    def test_tells_the_producer_not_to_pad_the_list(self):
        _, message = require_min_items("prospects", 50)(sample_prospects())
        assert "cannot evidence" in message

    def test_a_missing_field_is_reported_rather_than_crashing(self):
        ok, message = require_min_items("nonexistent", 1)(sample_funding())
        assert not ok and "missing" in message


class TestEvidence:
    def test_passes_when_every_item_is_sourced(self):
        ok, _ = require_evidence("opportunities")(sample_funding())
        assert ok

    def test_names_the_unsourced_items(self):
        report = sample_funding()
        report.opportunities[0].evidence = []
        ok, message = require_evidence("opportunities")(report)
        assert not ok
        assert "example-creative-ai-fund" in message


class TestOutreachGates:
    def test_a_campaign_with_opt_outs_passes(self):
        ok, _ = require_opt_out()(sample_campaign())
        assert ok

    def test_a_missing_opt_out_is_caught_before_anything_is_sent(self):
        campaign = sample_campaign()
        campaign.emails[1].opt_out_line = ""
        ok, message = require_opt_out()(campaign)
        assert not ok
        assert "step 2" in message

    def test_personalisation_must_name_its_source(self):
        campaign = sample_campaign()
        campaign.emails[0].personalisation_source = "I remembered it"
        ok, message = require_personalisation_sources()(campaign)
        assert not ok
        assert "step 1" in message


class TestAuditGates:
    def _report(self, **kwargs) -> AuditReport:
        defaults = dict(
            score=70.0,
            verdict="revise",
            findings=[
                AuditFinding(
                    severity="major",
                    dimension="evidence",
                    issue="unsourced claim",
                    fix="attach the URL the fact was read from",
                )
            ],
        )
        return AuditReport(**{**defaults, **kwargs})

    def test_a_findings_list_with_real_fixes_passes(self):
        ok, _ = require_audit_fixes()(self._report())
        assert ok

    def test_a_complaint_without_a_fix_is_sent_back(self):
        report = self._report(
            findings=[AuditFinding(severity="major", dimension="voice", issue="off tone", fix="fix it")]
        )
        ok, message = require_audit_fixes()(report)
        assert not ok
        assert "actionable fix" in message

    def test_passing_a_draft_that_still_has_blockers_is_refused(self):
        report = self._report(
            verdict="pass",
            findings=[
                AuditFinding(
                    severity="blocker",
                    dimension="eligibility",
                    issue="we are not eligible",
                    fix="drop this opportunity from the report",
                )
            ],
        )
        ok, message = require_audit_fixes()(report)
        assert not ok
        assert "blocker" in message


class TestModels:
    def test_evidence_rejects_anything_that_is_not_a_url(self):
        with pytest.raises(ValidationError):
            Evidence(source_name="x", source_url="ask me offline")

    def test_expected_value_weights_the_award_by_the_odds(self):
        opportunity = sample_funding().opportunities[0]
        assert opportunity.expected_value == pytest.approx(400_000 * 0.35)

    def test_blockers_are_easy_to_count(self):
        report = AuditReport(
            score=50,
            findings=[
                AuditFinding(severity="blocker", dimension="a", issue="i", fix="f"),
                AuditFinding(severity="minor", dimension="b", issue="i", fix="f"),
            ],
        )
        assert len(report.blockers) == 1

    def test_feedback_brief_puts_blockers_first(self):
        report = AuditReport(
            score=50,
            findings=[
                AuditFinding(severity="minor", dimension="polish", issue="nit", fix="tidy it"),
                AuditFinding(severity="blocker", dimension="eligibility", issue="ineligible", fix="drop it"),
            ],
        )
        brief = report.feedback_brief()
        assert brief.index("BLOCKER") < brief.index("MINOR")

    def test_feedback_brief_is_explicit_when_there_is_nothing_to_fix(self):
        assert "No findings" in AuditReport(score=95).feedback_brief()

    def test_a_score_outside_the_scale_is_rejected(self):
        with pytest.raises(ValidationError):
            AuditReport(score=130)

    def test_win_probability_is_a_probability(self):
        with pytest.raises(ValidationError):
            FundingOpportunity(
                id="x", name="x", funder="x", instrument="grant", geography="UAE",
                eligibility_summary="", why_hidden="", fit_rationale="",
                effort_days=1, win_probability=4.0, next_action="",
            )

    def test_artifacts_expose_their_ids_for_deduplication(self):
        assert sample_funding().ids() == ["example-creative-ai-fund", "example-compute-credits"]
        assert "example-retail-co" in sample_prospects().ids()
