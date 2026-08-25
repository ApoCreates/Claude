"""Deterministic scorers. The point of these is that the same facts always
produce the same number, so the tests pin the arithmetic rather than a vibe."""

from __future__ import annotations

from datetime import date, timedelta

from aigency_crew.tools.scoring import (
    evidence_quality,
    grant_fit_score,
    icp_fit_score,
    score_band,
)

TODAY = date(2026, 6, 1)


def evidence(n: int = 1, *, same_host: bool = False, confidence: float = 0.9):
    return [
        {
            "source_url": f"https://{'one' if same_host else f'src{i}'}.example.org/page",
            "confidence": confidence,
            "retrieved_on": TODAY,
            "quote": "supporting text",
        }
        for i in range(n)
    ]


def opportunity(**overrides):
    base = {
        "amount_max": 400_000,
        "win_probability": 0.4,
        "effort_days": 5,
        "deadline": TODAY + timedelta(days=45),
        "why_hidden": "Listed only in a ministry PDF and tagged under the wrong sector.",
        "evidence": evidence(2),
        "disqualifiers": [],
    }
    return {**base, **overrides}


class TestEvidenceQuality:
    def test_no_sources_scores_zero(self):
        assert evidence_quality([]) == 0.0

    def test_independent_hosts_beat_the_same_page_cited_twice(self):
        assert evidence_quality(evidence(3)) > evidence_quality(evidence(3, same_host=True))

    def test_low_confidence_drags_the_score_down(self):
        assert evidence_quality(evidence(2, confidence=0.1)) < evidence_quality(evidence(2))


class TestGrantFitScore:
    def test_a_well_evidenced_winnable_grant_lands_in_pursue_or_shortlist(self):
        result = grant_fit_score(opportunity(), today=TODAY)
        assert result["band"] in ("pursue", "shortlist")
        assert result["expected_value"] == 160_000.0

    def test_an_expired_deadline_scores_no_timing_points(self):
        result = grant_fit_score(
            opportunity(deadline=TODAY - timedelta(days=1)), today=TODAY
        )
        assert result["components"]["timing"] == 0.0

    def test_a_deadline_days_away_is_penalised_not_rewarded(self):
        tight = grant_fit_score(opportunity(deadline=TODAY + timedelta(days=3)), today=TODAY)
        workable = grant_fit_score(opportunity(), today=TODAY)
        assert tight["components"]["timing"] < workable["components"]["timing"]

    def test_rolling_programs_are_credited_without_a_deadline(self):
        result = grant_fit_score(
            opportunity(deadline=None, rolling=True), today=TODAY
        )
        assert result["components"]["timing"] > 0

    def test_unknown_deadline_is_treated_as_a_research_gap(self):
        unknown = grant_fit_score(opportunity(deadline=None), today=TODAY)
        known = grant_fit_score(opportunity(), today=TODAY)
        assert unknown["components"]["timing"] < known["components"]["timing"]

    def test_disqualifiers_carry_a_real_penalty(self):
        clean = grant_fit_score(opportunity(), today=TODAY)
        blocked = grant_fit_score(
            opportunity(disqualifiers=["not open to service businesses"]), today=TODAY
        )
        assert blocked["total"] == clean["total"] - 12.0

    def test_unsourced_claims_cost_the_evidence_component(self):
        result = grant_fit_score(opportunity(evidence=[]), today=TODAY)
        assert result["components"]["evidence"] == 0.0

    def test_effort_is_weighed_against_payoff(self):
        quick = grant_fit_score(opportunity(effort_days=1), today=TODAY)
        slow = grant_fit_score(opportunity(effort_days=40), today=TODAY)
        assert quick["total"] > slow["total"]

    def test_scores_are_reproducible(self):
        first = grant_fit_score(opportunity(), today=TODAY)
        second = grant_fit_score(opportunity(), today=TODAY)
        assert first == second

    def test_score_never_leaves_the_0_100_range(self):
        awful = grant_fit_score(
            opportunity(
                amount_max=0,
                win_probability=0.0,
                effort_days=0,
                deadline=TODAY - timedelta(days=400),
                why_hidden="",
                evidence=[],
                disqualifiers=["a", "b", "c", "d"],
            ),
            today=TODAY,
        )
        assert 0.0 <= awful["total"] <= 100.0


ICP = {
    "sectors": ["hospitality", "retail"],
    "geographies": ["united arab emirates", "saudi arabia"],
    "size_bands": ["mid_market", "enterprise"],
    "services": ["ai content production", "arabic localisation"],
}


def prospect(**overrides):
    base = {
        "sector": "hospitality",
        "country": "United Arab Emirates",
        "size_band": "mid_market",
        "services_matched": ["ai content production", "arabic localisation"],
        "trigger_event": "New head of brand appointed",
        "trigger_date": TODAY - timedelta(days=10),
        "contacts": [{"public_email": "hello@example.com"}, {"linkedin": "https://x/y"}],
        "disqualifiers": [],
    }
    return {**base, **overrides}


class TestIcpFitScore:
    def test_a_textbook_account_scores_in_the_pursue_band(self):
        assert icp_fit_score(prospect(), ICP, today=TODAY)["band"] == "pursue"

    def test_a_stale_trigger_is_worth_almost_nothing(self):
        stale = icp_fit_score(
            prospect(trigger_date=TODAY - timedelta(days=400)), ICP, today=TODAY
        )
        fresh = icp_fit_score(prospect(), ICP, today=TODAY)
        assert stale["components"]["timing"] < fresh["components"]["timing"]

    def test_no_trigger_at_all_scores_zero_for_timing(self):
        assert icp_fit_score(prospect(trigger_event=""), ICP, today=TODAY)["components"]["timing"] == 0.0

    def test_an_undated_trigger_is_only_half_believed(self):
        undated = icp_fit_score(prospect(trigger_date=None), ICP, today=TODAY)
        assert 0 < undated["components"]["timing"] < 20.0

    def test_out_of_profile_sector_and_geography_are_marked_down(self):
        off = icp_fit_score(
            prospect(sector="mining", country="Portugal"), ICP, today=TODAY
        )
        assert off["components"]["sector"] == 0.0
        assert off["components"]["geography"] == 5.0

    def test_unreachable_accounts_lose_contactability(self):
        assert icp_fit_score(prospect(contacts=[]), ICP, today=TODAY)["components"]["contactability"] == 0.0

    def test_exclusions_push_an_otherwise_good_account_down(self):
        excluded = icp_fit_score(
            prospect(disqualifiers=["existing client", "competitor"]), ICP, today=TODAY
        )
        assert excluded["total"] == icp_fit_score(prospect(), ICP, today=TODAY)["total"] - 30.0


class TestBands:
    def test_band_thresholds(self):
        assert score_band(95) == "pursue"
        assert score_band(80) == "pursue"
        assert score_band(60) == "shortlist"
        assert score_band(45) == "watch"
        assert score_band(10) == "drop"
