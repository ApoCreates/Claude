"""The stopping rules. These are what keep the double-checking from becoming
either a rubber stamp or an infinite argument, so they get the most coverage."""

from __future__ import annotations

import pytest

from aigency_crew.loops import (
    Decision,
    LoopController,
    LoopPolicy,
    Round,
    run_audited_cycle,
)
from aigency_crew.models import AuditFinding, AuditReport


def audit(score: float, *, blockers: int = 0, learnings: list[str] | None = None) -> AuditReport:
    findings = [
        AuditFinding(
            severity="blocker",
            dimension="evidence",
            item_ref=f"item-{i}",
            issue="unsourced claim",
            fix="attach the source URL",
        )
        for i in range(blockers)
    ]
    return AuditReport(score=score, findings=findings, learnings=learnings or [])


def rounds(*specs: tuple[float, int]) -> list[Round]:
    return [
        Round(number=i, artifact=f"draft-{i}", audit=audit(score, blockers=blockers))
        for i, (score, blockers) in enumerate(specs, start=1)
    ]


class TestPolicy:
    def test_rejects_nonsense_configuration(self):
        with pytest.raises(ValueError):
            LoopPolicy(max_rounds=0)
        with pytest.raises(ValueError):
            LoopPolicy(pass_score=140)
        with pytest.raises(ValueError):
            LoopPolicy(min_improvement=-1)


class TestDecisions:
    def test_clean_and_above_the_bar_is_accepted(self):
        decision = LoopController().decide(rounds((88.0, 0)))
        assert decision.action == "accept"

    def test_blocker_beats_a_high_score(self):
        """A blocker is a blocker at 99/100. This is the rule the whole
        double-check depends on."""
        decision = LoopController().decide(rounds((99.0, 1)))
        assert decision.action == "revise"
        assert "blocker" in decision.reason

    def test_below_the_bar_with_rounds_left_revises(self):
        decision = LoopController().decide(rounds((61.0, 0)))
        assert decision.action == "revise"
        assert "1" in decision.reason or "round" in decision.reason

    def test_stall_escalates_instead_of_grinding(self):
        decision = LoopController().decide(rounds((60.0, 0), (61.0, 0)))
        assert decision.action == "escalate"
        assert "stalled" in decision.reason

    def test_regression_escalates_and_names_the_rollback(self):
        decision = LoopController().decide(rounds((75.0, 0), (60.0, 0)))
        assert decision.action == "escalate"
        assert "regressed" in decision.reason
        assert "round 1" in decision.reason

    def test_exhausting_the_budget_escalates_rather_than_shipping(self):
        policy = LoopPolicy(max_rounds=2, min_improvement=0)
        decision = LoopController(policy).decide(rounds((50.0, 0), (70.0, 0)))
        assert decision.action == "escalate"
        assert "exhausted" in decision.reason

    def test_allow_blocker_pass_is_honoured_when_explicitly_set(self):
        policy = LoopPolicy(allow_blocker_pass=True)
        assert LoopController(policy).decide(rounds((90.0, 2))).action == "accept"

    def test_empty_history_is_a_programming_error(self):
        with pytest.raises(ValueError):
            LoopController().decide([])


class TestBestRound:
    def test_prefers_blocker_free_over_higher_scoring(self):
        best = LoopController.best_round(rounds((95.0, 1), (80.0, 0)))
        assert best.number == 2

    def test_ties_go_to_the_earlier_round(self):
        best = LoopController.best_round(rounds((80.0, 0), (80.0, 0)))
        assert best.number == 1


class FakeProducer:
    """Produces drafts; each revision is a new string so rollback is observable."""

    stage = "funding"

    def __init__(self):
        self.produced = 0
        self.feedback_seen: list[str] = []

    def produce(self, inputs):
        self.produced += 1
        return f"draft-{self.produced}"

    def revise(self, previous, audit, inputs):
        self.feedback_seen.append(audit.feedback_brief())
        self.produced += 1
        return f"draft-{self.produced}"


class FakeAuditor:
    def __init__(self, scores, blockers=()):
        self.scores = scores
        self.blockers = set(blockers)
        self.calls = 0

    def audit(self, artifact, inputs, round_number):
        self.calls += 1
        score = self.scores[min(round_number, len(self.scores)) - 1]
        return audit(
            score,
            blockers=1 if round_number in self.blockers else 0,
            learnings=[f"lesson from round {round_number}"],
        )


class TestRunAuditedCycle:
    def test_accepts_first_draft_without_a_revision(self):
        producer, auditor = FakeProducer(), FakeAuditor([92.0])
        result = run_audited_cycle(producer, auditor, {})
        assert result.outcome.accepted
        assert result.outcome.rounds_run == 1
        assert producer.produced == 1
        assert result.artifact == "draft-1"

    def test_revises_once_then_accepts_and_passes_feedback_back(self):
        producer, auditor = FakeProducer(), FakeAuditor([64.0, 87.0], blockers=[1])
        result = run_audited_cycle(producer, auditor, {})
        assert result.outcome.accepted
        assert result.outcome.rounds_run == 2
        assert result.artifact == "draft-2"
        assert result.outcome.score_history == [64.0, 87.0]
        assert "attach the source URL" in producer.feedback_seen[0]

    def test_returns_the_best_draft_not_the_last_one(self):
        producer, auditor = FakeProducer(), FakeAuditor([78.0, 55.0])
        result = run_audited_cycle(producer, auditor, {})
        assert result.outcome.escalated
        assert result.artifact == "draft-1", "a regression must never be what ships"

    def test_stops_at_max_rounds(self):
        producer = FakeProducer()
        auditor = FakeAuditor([40.0, 50.0, 60.0, 70.0])
        policy = LoopPolicy(max_rounds=3, min_improvement=0)
        result = run_audited_cycle(producer, auditor, {}, policy=policy)
        assert result.outcome.rounds_run == 3
        assert auditor.calls == 3
        assert result.outcome.escalated

    def test_collects_deduplicated_learnings_across_rounds(self):
        producer = FakeProducer()
        auditor = FakeAuditor([60.0, 90.0])
        result = run_audited_cycle(producer, auditor, {})
        assert result.learnings() == ["lesson from round 1", "lesson from round 2"]

    def test_reports_each_round_to_the_callback(self):
        seen: list[tuple[int, str]] = []
        run_audited_cycle(
            FakeProducer(),
            FakeAuditor([60.0, 90.0]),
            {},
            on_round=lambda rnd, decision: seen.append((rnd.number, decision.action)),
        )
        assert seen == [(1, "revise"), (2, "accept")]

    def test_stamps_stage_and_round_onto_every_audit(self):
        result = run_audited_cycle(FakeProducer(), FakeAuditor([60.0, 90.0]), {})
        assert [r.audit.round for r in result.history] == [1, 2]
        assert {r.audit.stage for r in result.history} == {"funding"}
