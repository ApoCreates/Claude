"""End-to-end orchestration, driven by the scripted agents in aigency_crew.demo.

No model, no network — these tests are about how the three pairs feed each
other and when the engine decides to go round again.
"""

from __future__ import annotations

import json

import pytest

from aigency_crew.settings import load_settings
from aigency_crew.demo import ScriptedWorkstream, demo_workstreams, sample_campaign
from aigency_crew.engine import GrowthEngine


@pytest.fixture
def engine(tmp_path, monkeypatch, ledger):
    monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
    settings = load_settings()
    return GrowthEngine(settings, ledger, demo_workstreams())


def failing_outreach(scores):
    """An outreach pair that keeps blaming the prospect list."""
    return ScriptedWorkstream(
        stage="outreach",
        artifact_factory=sample_campaign,
        scores=scores,
        blocker_rounds=(1, 2, 3, 4),
        dimension="personalisation",
    )


class TestSingleStage:
    def test_a_stage_runs_its_loop_and_reports_each_round(self, engine):
        messages: list[str] = []
        engine.report = messages.append
        result = engine.run_stage("funding")

        assert result.outcome.rounds_run == 2
        assert result.outcome.accepted
        assert any("round 1" in m for m in messages)
        assert any("-> accept" in m for m in messages)

    def test_a_finished_stage_writes_its_learnings_to_the_ledger(self, engine):
        engine.run_stage("funding")
        notes = engine.ledger.learnings("funding")
        assert notes and "licence type" in notes[0]

    def test_delivered_ids_are_remembered_so_the_next_run_brings_new_ones(self, engine):
        engine.run_stage("funding")
        assert "example-creative-ai-fund" in engine.ledger.seen("funding")
        assert engine.ledger.novel("funding", ["example-creative-ai-fund", "new-one"]) == ["new-one"]

    def test_missing_workstreams_are_caught_at_construction(self, ledger):
        with pytest.raises(ValueError, match="missing workstreams"):
            GrowthEngine(load_settings(), ledger, {"funding": object()})


class TestFullRun:
    def test_runs_all_three_stages_in_order(self, engine):
        result = engine.run(cycles=1)
        assert [o.stage for o in result.outcomes] == ["funding", "clients", "outreach"]
        assert result.funding is not None
        assert result.prospects is not None
        assert result.campaign is not None

    def test_a_clean_run_needs_no_human(self, engine):
        result = engine.run(cycles=1)
        assert not result.needs_human
        assert all(o.accepted for o in result.outcomes)

    def test_the_campaign_is_built_from_the_approved_list_and_funding(self, engine):
        seen: dict = {}
        original = engine.workstreams["outreach"].produce

        def spy(inputs):
            seen.update(inputs)
            return original(inputs)

        engine.workstreams["outreach"].produce = spy
        engine.run(cycles=1)

        assert "example-hospitality-group" in seen["approved_prospects"]
        assert "example-creative-ai-fund" in seen["approved_funding"]

    def test_the_run_is_logged_and_the_ledger_saved(self, engine):
        result = engine.run(cycles=1)
        assert engine.ledger.path.exists()
        assert engine.ledger.last_run()["run_id"] == result.run_id

    def test_outputs_are_written_as_readable_json(self, engine):
        result = engine.run(cycles=1)
        written = engine.write_outputs(result)
        assert set(written) == {"funding", "prospects", "campaign", "summary"}
        summary = json.loads(open(written["summary"], encoding="utf-8").read())
        assert summary["run_id"] == result.run_id
        campaign = json.loads(open(written["campaign"], encoding="utf-8").read())
        assert campaign["emails"][0]["opt_out_line"]


class TestEscalation:
    def test_a_stalled_stage_escalates_and_the_run_flags_it(self, engine):
        engine.workstreams["funding"].scores = [50.0, 51.0]
        result = engine.run(cycles=1)
        assert result.needs_human
        assert any("funding" in e for e in result.escalations)

    def test_an_escalated_stage_still_hands_over_its_best_draft(self, engine):
        engine.workstreams["funding"].scores = [70.0, 55.0]
        result = engine.run(cycles=1)
        assert result.funding is not None, "escalation must not throw the work away"


class TestRecycleDecision:
    def test_a_strong_campaign_ends_the_run(self, engine):
        result = engine.run(cycles=2)
        assert result.cycles_run == 1

    def test_a_weak_campaign_blamed_on_the_list_triggers_another_cycle(self, engine):
        engine.workstreams["outreach"] = failing_outreach([40.0, 44.0])
        result = engine.run(cycles=2)
        assert result.cycles_run == 2, "upstream findings should send it back to prospecting"

    def test_the_second_cycle_gets_the_auditor_findings_as_feedback(self, engine):
        engine.workstreams["outreach"] = failing_outreach([40.0, 44.0])
        seen: list[dict] = []
        original = engine.workstreams["clients"].produce
        engine.workstreams["clients"].produce = lambda inputs: (seen.append(inputs), original(inputs))[1]

        engine.run(cycles=2)
        assert len(seen) == 2
        assert "Demo blocker" in seen[1]["feedback"]

    def test_copy_only_problems_do_not_waste_a_cycle(self, engine):
        weak_copy = failing_outreach([40.0, 44.0])
        weak_copy.dimension = "voice"  # nothing to do with the prospect list
        engine.workstreams["outreach"] = weak_copy
        result = engine.run(cycles=2)
        assert result.cycles_run == 1

    def test_the_cycle_budget_is_hard(self, engine):
        engine.workstreams["outreach"] = failing_outreach([40.0, 44.0])
        result = engine.run(cycles=1)
        assert result.cycles_run == 1

    def test_the_reason_for_stopping_is_always_stated(self, engine):
        messages: list[str] = []
        engine.report = messages.append
        engine.run(cycles=1)
        assert any("cycle 1" in m for m in messages)
