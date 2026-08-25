"""The loop controller — the part that keeps the double-checking healthy.

A produce/audit pair left to its own devices fails in two directions: it either
spins forever chasing a score it will never reach, or it accepts the first
draft because nobody set a bar. :class:`LoopController` is the referee. It is
deliberately free of CrewAI imports so the stopping rules can be tested without
an LLM anywhere near them.

Rules, in priority order:

1. A blocker finding never passes, whatever the score says.
2. A clean artifact at or above ``pass_score`` is accepted immediately.
3. A round that fails to improve on the previous one by ``min_improvement``
   stops the loop — grinding costs money and usually makes things worse.
4. A round that scores *lower* than the one before it stops the loop and rolls
   back to the best artifact seen.
5. Running out of rounds escalates to a human rather than shipping.

Escalation is a normal outcome, not an error. The engine's job is to hand a
person the best artifact it produced plus the reason it stopped.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Protocol

from .models import AuditReport, CycleOutcome

Action = str  # "accept" | "revise" | "escalate"


@dataclass(frozen=True)
class LoopPolicy:
    """Stopping rules for one produce/audit pair."""

    max_rounds: int = 3
    pass_score: float = 80.0
    min_improvement: float = 3.0
    allow_blocker_pass: bool = False

    def __post_init__(self) -> None:
        if self.max_rounds < 1:
            raise ValueError("max_rounds must be at least 1")
        if not 0 <= self.pass_score <= 100:
            raise ValueError("pass_score must be within 0..100")
        if self.min_improvement < 0:
            raise ValueError("min_improvement cannot be negative")


@dataclass
class Round:
    """One turn of the loop: what was produced and what the auditor made of it."""

    number: int
    artifact: Any
    audit: AuditReport

    @property
    def score(self) -> float:
        return self.audit.score

    @property
    def blocker_count(self) -> int:
        return len(self.audit.blockers)


@dataclass(frozen=True)
class Decision:
    action: Action
    reason: str


class LoopController:
    """Decides, after each audit, whether to accept, revise, or escalate."""

    def __init__(self, policy: Optional[LoopPolicy] = None) -> None:
        self.policy = policy or LoopPolicy()

    def decide(self, history: list[Round]) -> Decision:
        if not history:
            raise ValueError("decide() needs at least one completed round")

        policy = self.policy
        current = history[-1]
        previous = history[-2] if len(history) > 1 else None
        rounds_left = policy.max_rounds - current.number

        clean = current.blocker_count == 0 or policy.allow_blocker_pass

        if clean and current.score >= policy.pass_score:
            return Decision(
                "accept",
                f"scored {current.score:.1f} >= {policy.pass_score:.1f} with no blockers",
            )

        if previous is not None:
            delta = current.score - previous.score
            if delta < 0:
                return Decision(
                    "escalate",
                    f"round {current.number} regressed by {abs(delta):.1f} points "
                    f"({previous.score:.1f} -> {current.score:.1f}); "
                    f"rolling back to round {self.best_round(history).number}",
                )
            if delta < policy.min_improvement:
                return Decision(
                    "escalate",
                    f"round {current.number} improved by only {delta:.1f} "
                    f"(< {policy.min_improvement:.1f}); the loop has stalled",
                )

        if rounds_left <= 0:
            unmet = (
                f"{current.blocker_count} blocker(s) unresolved"
                if not clean
                else f"score {current.score:.1f} < {policy.pass_score:.1f}"
            )
            return Decision(
                "escalate", f"exhausted {policy.max_rounds} round(s) with {unmet}"
            )

        need = (
            f"{current.blocker_count} blocker(s)"
            if not clean
            else f"score {current.score:.1f} < {policy.pass_score:.1f}"
        )
        return Decision("revise", f"{need}; {rounds_left} round(s) left")

    @staticmethod
    def best_round(history: list[Round]) -> Round:
        """Highest-scoring round, preferring blocker-free ones and earlier ties."""
        return max(
            history,
            key=lambda r: (r.blocker_count == 0, r.score, -r.number),
        )


# --------------------------------------------------------------------------
# Running a pair
# --------------------------------------------------------------------------


class Producer(Protocol):
    """A main agent: makes the artifact, then fixes it when told what is wrong."""

    stage: str

    def produce(self, inputs: dict) -> Any: ...

    def revise(self, previous: Any, audit: AuditReport, inputs: dict) -> Any: ...


class Auditor(Protocol):
    """A double-check agent: scores the artifact and says exactly what to fix."""

    def audit(self, artifact: Any, inputs: dict, round_number: int) -> AuditReport: ...


@dataclass
class CycleResult:
    """Everything one produce/audit pair produced, decided, and learned."""

    stage: str
    artifact: Any
    outcome: CycleOutcome
    history: list[Round] = field(default_factory=list)
    decisions: list[Decision] = field(default_factory=list)

    @property
    def audit(self) -> AuditReport:
        return self.history[-1].audit

    def learnings(self) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []
        for rnd in self.history:
            for note in rnd.audit.learnings:
                key = note.strip().lower()
                if key and key not in seen:
                    seen.add(key)
                    ordered.append(note.strip())
        return ordered


def run_audited_cycle(
    producer: Producer,
    auditor: Auditor,
    inputs: dict,
    policy: Optional[LoopPolicy] = None,
    on_round: Optional[Callable[[Round, Decision], None]] = None,
) -> CycleResult:
    """Run produce -> audit -> revise until the controller says stop.

    The artifact returned is the *best* round's artifact, not necessarily the
    last one: a regression must never be what ships.
    """

    controller = LoopController(policy)
    history: list[Round] = []
    decisions: list[Decision] = []

    artifact = producer.produce(inputs)

    for number in range(1, controller.policy.max_rounds + 1):
        audit = auditor.audit(artifact, inputs, number)
        audit.stage = producer.stage
        audit.round = number

        current = Round(number=number, artifact=artifact, audit=audit)
        history.append(current)

        decision = controller.decide(history)
        decisions.append(decision)
        if on_round is not None:
            on_round(current, decision)

        if decision.action != "revise":
            break

        artifact = producer.revise(artifact, audit, inputs)

    best = LoopController.best_round(history)
    final = decisions[-1]

    outcome = CycleOutcome(
        stage=producer.stage,
        rounds_run=len(history),
        accepted=final.action == "accept",
        escalated=final.action == "escalate",
        final_score=best.score,
        reason=final.reason,
        score_history=[r.score for r in history],
    )

    return CycleResult(
        stage=producer.stage,
        artifact=best.artifact,
        outcome=outcome,
        history=history,
        decisions=decisions,
    )
