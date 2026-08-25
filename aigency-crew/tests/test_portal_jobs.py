"""The job state machine: gates, rounds, reverts, and sending work back.

Driven with the scripted agents, so a full three-stage supervised run takes
milliseconds and costs nothing.
"""

from __future__ import annotations

import pytest

from aigency_crew.demo import demo_workstreams
from aigency_crew.engine import GrowthEngine
from aigency_crew.ledger import Ledger
from aigency_crew.portal.jobs import (
    APPROVED,
    AWAITING,
    PENDING,
    REJECTED,
    Job,
    JobRunner,
    JobStore,
)
from aigency_crew.settings import load_settings


@pytest.fixture
def runner(tmp_path, monkeypatch):
    monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
    store = JobStore(tmp_path / "jobs")
    ledger = Ledger.load(tmp_path / "ledger.json")

    def factory():
        return GrowthEngine(load_settings(), ledger, demo_workstreams())

    return JobRunner(store, factory)


@pytest.fixture
def job(runner):
    job = Job.create({"dry_run": True})
    runner.store.save(job)
    return job


def run_stage(runner, job, stage):
    """Run a stage synchronously, then reload the job from disk."""
    runner.run_stage_now(job.id, stage)
    return runner.store.load(job.id)


class TestGates:
    def test_a_fresh_job_starts_with_funding_and_nothing_else(self, job):
        assert job.next_runnable() == "funding"
        assert all(job.stages[s].status == PENDING for s in ("funding", "clients", "outreach"))

    def test_a_finished_stage_parks_for_approval_rather_than_continuing(self, runner, job):
        job = run_stage(runner, job, "funding")
        assert job.stages["funding"].status == AWAITING
        assert job.stages["clients"].status == PENDING
        assert job.next_runnable() is None
        assert "waiting for your approval" in job.blocked_reason()

    def test_a_later_stage_cannot_be_started_before_the_one_before_it_is_approved(
        self, runner, job
    ):
        run_stage(runner, job, "funding")
        job = runner.store.load(job.id)
        with pytest.raises(ValueError, match="cannot start until funding is approved"):
            runner.start_stage(job, "clients")

    def test_approving_opens_the_next_stage(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.approve(job, "funding", auto_start_next=False)
        job = runner.store.load(job.id)
        assert job.stages["funding"].status == APPROVED
        assert job.next_runnable() == "clients"

    def test_approving_can_hold_instead_of_launching_the_next_stage(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.approve(job, "funding", note="looks fine", auto_start_next=False)
        job = runner.store.load(job.id)
        assert job.stages["clients"].status == PENDING
        assert job.stages["funding"].notes[-1]["note"] == "looks fine"

    def test_a_job_is_complete_only_when_all_three_gates_are_passed(self, runner, job):
        for stage in ("funding", "clients", "outreach"):
            job = run_stage(runner, job, stage)
            runner.approve(job, stage, auto_start_next=False)
            job = runner.store.load(job.id)
        assert job.is_complete


class TestSendingWorkBack:
    def test_rejection_needs_a_reason(self, runner, job):
        job = run_stage(runner, job, "funding")
        with pytest.raises(ValueError, match="needs a note"):
            runner.reject(job, "funding", "   ")

    def test_a_rejected_stage_is_runnable_again_and_keeps_the_note(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.reject(job, "funding", "Drop anything without a named contact", rerun=False)
        job = runner.store.load(job.id)
        assert job.stages["funding"].status == REJECTED
        assert job.next_runnable() == "funding"
        assert "named contact" in job.stages["funding"].latest_note()

    def test_the_note_reaches_the_agent_as_an_overriding_instruction(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.reject(job, "funding", "Only UAE programmes please", rerun=False)
        job = runner.store.load(job.id)

        inputs = runner._stage_inputs(job, "funding")
        assert "Only UAE programmes please" in inputs["feedback"]
        assert "outranks your own judgement" in inputs["feedback"]
        assert "previous_json" in inputs

    def test_a_re_run_appends_rounds_rather_than_erasing_the_first_attempt(self, runner, job):
        job = run_stage(runner, job, "funding")
        first = len(job.stages["funding"].rounds)
        runner.reject(job, "funding", "again please", rerun=False)
        job = run_stage(runner, runner.store.load(job.id), "funding")
        assert len(job.stages["funding"].rounds) > first
        assert [r.number for r in job.stages["funding"].rounds] == list(
            range(1, len(job.stages["funding"].rounds) + 1)
        )


class TestRoundsAndReverting:
    def test_every_round_is_kept_not_just_the_accepted_one(self, runner, job):
        job = run_stage(runner, job, "funding")
        assert len(job.stages["funding"].rounds) == 2, "the loop ran twice; keep both"

    def test_the_best_round_is_the_one_in_use(self, runner, job):
        job = run_stage(runner, job, "funding")
        state = job.stages["funding"]
        assert state.selected_round == 2
        assert state.score == 86.0

    def test_reverting_switches_which_round_counts(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.revert(job, "funding", 1)
        job = runner.store.load(job.id)
        assert job.stages["funding"].selected_round == 1
        assert job.stages["funding"].score == 64.0
        assert "reverted to round 1" in job.stages["funding"].notes[-1]["note"]

    def test_reverting_to_a_round_that_never_happened_is_refused(self, runner, job):
        job = run_stage(runner, job, "funding")
        with pytest.raises(ValueError, match="no round 9"):
            runner.revert(job, "funding", 9)

    def test_a_reverted_stage_is_what_the_next_stage_consumes(self, runner, job):
        run_stage(runner, job, "funding")
        job = runner.store.load(job.id)
        runner.revert(job, "funding", 1)
        job = runner.store.load(job.id)
        runner.approve(job, "funding", auto_start_next=False)
        job = runner.store.load(job.id)
        run_stage(runner, job, "clients")
        job = runner.store.load(job.id)
        runner.approve(job, "clients", auto_start_next=False)
        job = runner.store.load(job.id)

        inputs = runner._stage_inputs(job, "outreach")
        assert "demo-r1" in inputs["approved_funding"], "round 1 was the reverted choice"

    def test_the_findings_that_drove_each_round_are_kept_with_it(self, runner, job):
        job = run_stage(runner, job, "funding")
        first = job.stages["funding"].rounds[0]
        assert first.findings
        assert first.findings[0]["severity"] == "blocker"
        assert first.findings[0]["fix"]


class TestEvaluation:
    def test_a_human_rating_is_stored_on_the_stage(self, runner, job):
        job = run_stage(runner, job, "funding")
        runner.evaluate(job, "funding", 45.0, "Two of these were obviously out of scope")
        job = runner.store.load(job.id)
        assert job.stages["funding"].evaluation["score"] == 45.0

    def test_the_rating_becomes_a_standing_rule_for_future_runs(self, runner, job, tmp_path):
        ledger = Ledger.load(tmp_path / "ledger.json")
        job = run_stage(runner, job, "funding")
        runner.evaluate(job, "funding", 45.0, "Skip anything needing matched funding", ledger)

        reloaded = Ledger.load(tmp_path / "ledger.json")
        assert any("matched funding" in note for note in reloaded.learnings("funding"))

    def test_an_empty_note_teaches_nothing(self, runner, job, tmp_path):
        ledger = Ledger.load(tmp_path / "ledger.json")
        job = run_stage(runner, job, "funding")
        runner.evaluate(job, "funding", 80.0, "   ", ledger)
        assert Ledger.load(tmp_path / "ledger.json").learnings("funding") == [
            n for n in Ledger.load(tmp_path / "ledger.json").learnings("funding")
            if not n.startswith("Human review")
        ]


class TestPersistence:
    def test_a_job_survives_a_reload(self, runner, job):
        run_stage(runner, job, "funding")
        reloaded = runner.store.load(job.id)
        assert reloaded.stages["funding"].status == AWAITING
        assert reloaded.stages["funding"].rounds[0].artifact["opportunities"]

    def test_the_index_lists_newest_first(self, runner):
        ids = []
        for _ in range(3):
            j = Job.create()
            runner.store.save(j)
            ids.append(j.id)
        listed = [j.id for j in runner.store.list()]
        assert set(listed) == set(ids)

    def test_a_corrupt_job_file_does_not_break_the_index(self, runner, job):
        (runner.store.root / "job-broken.json").write_text("{oops", encoding="utf-8")
        assert job.id in [j.id for j in runner.store.list()]

    def test_deleting_removes_it(self, runner, job):
        assert runner.store.delete(job.id)
        assert runner.store.load(job.id) is None


class TestConcurrentWrites:
    """Stages run in background threads while the browser polls the index."""

    def test_a_job_never_appears_corrupt_while_it_is_being_written(self, runner, job):
        import threading

        stop = threading.Event()
        misses: list[str] = []

        def hammer_the_index():
            while not stop.is_set():
                if job.id not in [j.id for j in runner.store.list()]:
                    misses.append("job vanished from the index mid-write")

        reader = threading.Thread(target=hammer_the_index, daemon=True)
        reader.start()
        try:
            for _ in range(60):
                runner.store.save(job)
        finally:
            stop.set()
            reader.join(timeout=2)

        assert not misses, misses[0]

    def test_no_temp_files_are_left_behind(self, runner, job):
        runner.store.save(job)
        assert not list(runner.store.root.glob("*.tmp"))
