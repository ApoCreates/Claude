"""Mechanical checks that run before the auditor agent ever sees the draft.

There are two layers of double-checking in this engine and they do different
jobs. The auditor agents judge — eligibility, plausibility, voice, whether a
trigger event is really a trigger event. The guardrails here just count and
look for required fields, deterministically, and hand the producer a specific
complaint on the spot.

Cheap checks belong in the cheap layer. Spending an audit round telling a
producer it returned four items instead of eight is a waste of a round.
"""

from __future__ import annotations

from typing import Any, Callable, Tuple

GuardrailResult = Tuple[bool, Any]
Guardrail = Callable[[Any], GuardrailResult]


def quality_only(guardrails: list[Guardrail]) -> list[Guardrail]:
    """Everything except the count floors — the set a revision is held to."""
    return [g for g in guardrails if not getattr(g, "counts_items", False)]


def _artifact(result: Any) -> Any:
    """Pull the structured object out of a CrewAI TaskOutput."""
    return getattr(result, "pydantic", None) or result


def require_min_items(collection: str, minimum: int) -> Guardrail:
    """Fail when a list field came back shorter than the brief asked for.

    Count guardrails are marked so the revision pass can drop them. A first
    draft that returns four items when eight were asked for has under-delivered;
    a *revision* that returns four has usually just cut what it could not
    evidence, which is exactly what the auditor told it to do. Enforcing a floor
    there turns honest pruning into a hard failure.
    """

    def check(result: Any) -> GuardrailResult:
        artifact = _artifact(result)
        items = getattr(artifact, collection, None)
        if items is None:
            return False, f"Output is missing the '{collection}' list entirely."
        if len(items) < minimum:
            return (
                False,
                f"Only {len(items)} item(s) in '{collection}'; the brief asked for at "
                f"least {minimum}. Continue researching and return the full set — "
                f"do not pad the list with items you cannot evidence.",
            )
        return True, result

    check.counts_items = True  # type: ignore[attr-defined]
    return check


def require_evidence(collection: str, minimum_per_item: int = 1) -> Guardrail:
    """Fail when any item in a list carries fewer sources than required."""

    def check(result: Any) -> GuardrailResult:
        artifact = _artifact(result)
        items = getattr(artifact, collection, []) or []
        thin = [
            getattr(item, "id", None) or getattr(item, "name", "unnamed")
            for item in items
            if len(getattr(item, "evidence", []) or []) < minimum_per_item
        ]
        if thin:
            return (
                False,
                f"These items carry fewer than {minimum_per_item} evidence "
                f"entries: {', '.join(map(str, thin[:10]))}. Add the source URL you "
                f"read each fact from, or drop the item.",
            )
        return True, result

    return check


def require_opt_out() -> Guardrail:
    """Every commercial email needs a real opt-out line. Non-negotiable."""

    def check(result: Any) -> GuardrailResult:
        campaign = _artifact(result)
        missing = [
            f"step {getattr(email, 'step', '?')} to {getattr(email, 'prospect_id', '?')}"
            for email in getattr(campaign, "emails", []) or []
            if len(str(getattr(email, "opt_out_line", "") or "").strip()) < 10
        ]
        if missing:
            return (
                False,
                "These emails have no usable opt-out line: "
                f"{', '.join(missing[:10])}. Add a genuine unsubscribe sentence to "
                "every message before returning it.",
            )
        return True, result

    return check


def require_personalisation_sources() -> Guardrail:
    """A personalised line with no source is a line the sender cannot defend."""

    def check(result: Any) -> GuardrailResult:
        campaign = _artifact(result)
        unsourced = [
            f"step {getattr(email, 'step', '?')} to {getattr(email, 'prospect_id', '?')}"
            for email in getattr(campaign, "emails", []) or []
            if not str(getattr(email, "personalisation_source", "") or "").startswith("http")
        ]
        if unsourced:
            return (
                False,
                "These emails do not name the URL their personalisation came from: "
                f"{', '.join(unsourced[:10])}. Set personalisation_source to the "
                "evidence URL for that account, or rewrite the line generically.",
            )
        return True, result

    return check


def require_audit_fixes() -> Guardrail:
    """An auditor that reports problems without fixes has only made more work."""

    def check(result: Any) -> GuardrailResult:
        report = _artifact(result)
        vague = [
            f.issue[:60]
            for f in getattr(report, "findings", []) or []
            if len(str(getattr(f, "fix", "") or "").strip()) < 15
        ]
        if vague:
            return (
                False,
                "These findings have no actionable fix: "
                f"{'; '.join(vague[:5])}. Every finding must say exactly what the "
                "producer should do differently.",
            )
        verdict = getattr(report, "verdict", None)
        blockers = [
            f for f in getattr(report, "findings", []) or []
            if getattr(f, "severity", "") == "blocker"
        ]
        if verdict == "pass" and blockers:
            return (
                False,
                f"Verdict is 'pass' but you recorded {len(blockers)} blocker(s). "
                "Either downgrade the findings or change the verdict to 'revise'.",
            )
        return True, result

    return check
