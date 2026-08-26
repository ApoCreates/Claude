"""Deterministic scorers.

Asking an LLM to "rate this 0-100" produces a number that drifts between runs
and cannot be argued with. These functions produce the same score for the same
facts every time, so week-three's ranking is comparable to week-one's and a
human can see exactly which component dragged an item down.

Both agents in a pair use the same scorer: the producer to rank its own work,
the auditor to check the producer's arithmetic rather than its taste.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Mapping, Optional

__all__ = [
    "grant_fit_score",
    "icp_fit_score",
    "evidence_quality",
    "score_band",
]


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _as_date(value: Any) -> Optional[date]:
    if isinstance(value, date):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return date.fromisoformat(value.strip()[:10])
        except ValueError:
            return None
    return None


def score_band(score: float) -> str:
    if score >= 80:
        return "pursue"
    if score >= 60:
        return "shortlist"
    if score >= 40:
        return "watch"
    return "drop"


def evidence_quality(evidence: list[Mapping[str, Any]] | None) -> float:
    """0-100 on how well sourced a claim is.

    Two independent domains beats one page cited five times, so distinct hosts
    are what count.
    """
    items = evidence or []
    if not items:
        return 0.0

    hosts: set[str] = set()
    confidences: list[float] = []
    dated = 0
    quoted = 0

    for item in items:
        url = str(item.get("source_url", ""))
        if "//" in url:
            hosts.add(url.split("//", 1)[1].split("/", 1)[0].lower().removeprefix("www."))
        confidences.append(float(item.get("confidence", 0.5) or 0.0))
        if item.get("retrieved_on"):
            dated += 1
        if str(item.get("quote", "")).strip():
            quoted += 1

    breadth = min(len(hosts), 3) / 3 * 45
    trust = (sum(confidences) / len(confidences)) * 30
    freshness = (dated / len(items)) * 15
    verbatim = (quoted / len(items)) * 10
    return round(_clamp(breadth + trust + freshness + verbatim), 1)


def grant_fit_score(
    opportunity: Mapping[str, Any],
    *,
    today: Optional[date] = None,
    max_award_reference: float = 1_000_000.0,
) -> dict[str, Any]:
    """Rank a funding opportunity by payoff, winnability, cost, and proof.

    ``max_award_reference`` normalises award size; set it to the largest award
    the studio would realistically pursue so a mega-grant does not flatten the
    scale for everything else.
    """
    today = today or date.today()
    components: dict[str, float] = {}

    award = float(opportunity.get("amount_max") or opportunity.get("amount_min") or 0.0)
    components["award_size"] = round(
        min(award / max_award_reference, 1.0) * 25 if award > 0 else 0.0, 1
    )

    probability = float(opportunity.get("win_probability", 0.0) or 0.0)
    components["winnability"] = round(_clamp(probability, 0.0, 1.0) * 20, 1)

    effort = float(opportunity.get("effort_days", 0.0) or 0.0)
    if award > 0 and effort > 0:
        # Value per person-day, saturating at AED 100k/day.
        per_day = (award * probability) / effort
        components["effort_return"] = round(min(per_day / 100_000, 1.0) * 15, 1)
    elif effort == 0 and award > 0:
        components["effort_return"] = 15.0  # rolling/no-application programs
    else:
        components["effort_return"] = 0.0

    deadline = _as_date(opportunity.get("deadline"))
    if opportunity.get("rolling"):
        components["timing"] = 12.0
    elif deadline is None:
        components["timing"] = 4.0  # unknown deadline is a research gap, not a plus
    else:
        days = (deadline - today).days
        if days < 0:
            components["timing"] = 0.0
        elif days < 10:
            components["timing"] = 3.0  # too tight to write a good submission
        elif days <= 90:
            components["timing"] = 15.0
        else:
            components["timing"] = 10.0

    components["evidence"] = round(
        evidence_quality(list(opportunity.get("evidence", []) or [])) / 100 * 15, 1
    )

    hidden = str(opportunity.get("why_hidden", "")).strip()
    components["novelty"] = 10.0 if len(hidden) >= 40 else (5.0 if hidden else 0.0)

    penalty = min(len(opportunity.get("disqualifiers", []) or []) * 12.0, 36.0)

    total = round(_clamp(sum(components.values()) - penalty), 1)
    return {
        "total": total,
        "band": score_band(total),
        "components": components,
        "disqualifier_penalty": penalty,
        "expected_value": round(award * probability, 2),
    }


def icp_fit_score(
    prospect: Mapping[str, Any],
    icp: Mapping[str, Any],
    *,
    today: Optional[date] = None,
) -> dict[str, Any]:
    """Score an account against the ideal-customer profile in ``knowledge/icp.md``.

    ``icp`` is expected to carry ``sectors``, ``geographies``, ``size_bands``,
    and ``services`` as lists of lowercase strings.
    """
    today = today or date.today()
    components: dict[str, float] = {}

    sectors = {s.lower() for s in icp.get("sectors", [])}
    sector = str(prospect.get("sector", "")).lower()
    components["sector"] = 25.0 if sector in sectors else (
        10.0 if any(s in sector or sector in s for s in sectors if s) else 0.0
    )

    geos = {g.lower() for g in icp.get("geographies", [])}
    country = str(prospect.get("country", "")).lower()
    components["geography"] = 15.0 if country in geos else 5.0

    bands = {b.lower() for b in icp.get("size_bands", [])}
    components["size"] = 10.0 if str(prospect.get("size_band", "")).lower() in bands else 3.0

    services = {s.lower() for s in icp.get("services", [])}
    matched = {str(s).lower() for s in prospect.get("services_matched", [])}
    overlap = len(services & matched)
    components["service_fit"] = round(min(overlap / 2, 1.0) * 20, 1) if services else 0.0

    trigger_date = _as_date(prospect.get("trigger_date"))
    has_trigger = bool(str(prospect.get("trigger_event", "")).strip())
    if not has_trigger:
        components["timing"] = 0.0
    elif trigger_date is None:
        components["timing"] = 6.0  # a "why now" with no date is barely a why now
    else:
        age = (today - trigger_date).days
        if age < 0:
            components["timing"] = 18.0  # announced, not yet happened
        elif age <= 30:
            components["timing"] = 20.0
        elif age <= 90:
            components["timing"] = 14.0
        elif age <= 180:
            components["timing"] = 8.0
        else:
            components["timing"] = 2.0

    contacts = list(prospect.get("contacts", []) or [])
    reachable = sum(1 for c in contacts if c.get("public_email") or c.get("linkedin"))
    components["contactability"] = round(min(reachable / 2, 1.0) * 10, 1)

    penalty = min(len(prospect.get("disqualifiers", []) or []) * 15.0, 45.0)

    total = round(_clamp(sum(components.values()) - penalty), 1)
    return {
        "total": total,
        "band": score_band(total),
        "components": components,
        "disqualifier_penalty": penalty,
    }
