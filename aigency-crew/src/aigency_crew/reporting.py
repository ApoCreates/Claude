"""Turn a finished run into something you can actually read.

The engine writes JSON because the next run has to read it back. People
should not have to. This renders a run directory as a markdown digest: what
to apply for, who to call, what to send, and anything the loop escalated.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any, Optional

from .settings import output_dir


def latest_run(root: Optional[Path] = None) -> Optional[Path]:
    """Most recent run directory, or None if nothing has been run yet."""
    root = root or output_dir()
    runs = sorted((p for p in root.glob("run-*") if p.is_dir()), key=lambda p: p.name)
    return runs[-1] if runs else None


def _load(run_dir: Path, name: str) -> Optional[dict[str, Any]]:
    path = run_dir / f"{name}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _money(item: dict[str, Any]) -> str:
    low, high = item.get("amount_min"), item.get("amount_max")
    currency = item.get("currency", "")
    if not low and not high:
        return "—"
    if low and high and low != high:
        return f"{currency} {low:,.0f}–{high:,.0f}"
    return f"{currency} {(high or low):,.0f}"


def _deadline(item: dict[str, Any]) -> str:
    if item.get("rolling"):
        return "rolling"
    raw = item.get("deadline")
    if not raw:
        return "unknown"
    try:
        due = date.fromisoformat(str(raw)[:10])
    except ValueError:
        return str(raw)
    days = (due - date.today()).days
    return f"{due.isoformat()} ({days}d)" if days >= 0 else f"{due.isoformat()} (passed)"


def _table(headers: list[str], rows: list[list[str]]) -> list[str]:
    if not rows:
        return ["_Nothing recorded._", ""]
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    out += ["| " + " | ".join(str(c).replace("|", "\\|") for c in row) + " |" for row in rows]
    return out + [""]


def _header(summary: dict[str, Any]) -> list[str]:
    lines = [f"# Run {summary.get('run_id', '?')}", ""]
    rows = [
        [
            s["stage"],
            f"{s['score']:.0f}",
            str(s["rounds"]),
            "accepted" if s["accepted"] else ("escalated" if s["escalated"] else "—"),
            s["reason"],
        ]
        for s in summary.get("stages", [])
    ]
    lines += _table(["Stage", "Score", "Rounds", "Outcome", "Why the loop stopped"], rows)

    if summary.get("escalations"):
        lines += ["## ⚠ Needs your eyes", ""]
        lines += [f"- {e}" for e in summary["escalations"]]
        lines += [
            "",
            "_These stages stopped before clearing the bar. The best draft is still "
            "below — read it before acting on it._",
            "",
        ]
    return lines


def _nothing_survived(kind: str, rejected: list[str]) -> list[str]:
    """Say plainly when the auditor emptied the list.

    A live run ended exactly here: eleven programmes found, none of them
    sourceable without web access, all of them dropped. That is an honest and
    useful answer — but only if the report says so instead of rendering an
    empty table.
    """
    lines = [
        f"> **Nothing survived audit.** Every {kind} found this run was dropped "
        "for failing the evidence or eligibility bar. That is a real result, not "
        "an error: the reasons below are what to fix before re-running.",
        "",
    ]
    if rejected:
        lines += [f"**Dropped ({len(rejected)}):**", ""]
        lines += [f"- {r}" for r in rejected] + [""]
    return lines


def _funding_section(report: dict[str, Any]) -> list[str]:
    opportunities = sorted(
        report.get("opportunities", []),
        key=lambda o: (o.get("amount_max") or 0) * (o.get("win_probability") or 0),
        reverse=True,
    )
    lines = ["## Funding", ""]
    if not opportunities:
        return lines + _nothing_survived(
            "opportunity", report.get("searched_but_rejected", []) or []
        )
    lines += _table(
        ["Opportunity", "Funder", "Type", "Amount", "Deadline", "Effort", "Win", "Next action"],
        [
            [
                o.get("name", "?"),
                o.get("funder", "?"),
                o.get("instrument", "?"),
                _money(o),
                _deadline(o),
                f"{o.get('effort_days', 0):.0f}d",
                f"{(o.get('win_probability') or 0) * 100:.0f}%",
                o.get("next_action", "—"),
            ]
            for o in opportunities
        ],
    )
    for o in opportunities:
        lines += [f"### {o.get('name')}", ""]
        lines += [f"- **Why it's under the radar:** {o.get('why_hidden', '—')}"]
        lines += [f"- **Why us:** {o.get('fit_rationale', '—')}"]
        lines += [f"- **Eligibility:** {o.get('eligibility_summary', '—')}"]
        if o.get("disqualifiers"):
            lines += ["- **Could disqualify us:** " + "; ".join(o["disqualifiers"])]
        for e in o.get("evidence", []):
            lines += [f"- **Source:** [{e.get('source_name', 'link')}]({e.get('source_url')})"]
        lines += [""]
    if report.get("searched_but_rejected"):
        lines += ["### Looked at and dropped", ""]
        lines += [f"- {r}" for r in report["searched_but_rejected"]] + [""]
    return lines


def _prospect_section(listing: dict[str, Any]) -> list[str]:
    prospects = sorted(
        listing.get("prospects", []), key=lambda p: p.get("fit_score", 0), reverse=True
    )
    lines = ["## Client pipeline", ""]
    if not prospects:
        return lines + _nothing_survived("account", listing.get("excluded", []) or [])
    lines += _table(
        ["Company", "Sector", "Country", "Fit", "Why now", "Who to contact"],
        [
            [
                p.get("company", "?"),
                p.get("sector", "?"),
                p.get("country", "?"),
                f"{p.get('fit_score', 0):.0f}",
                p.get("trigger_event", "—"),
                ", ".join(
                    f"{c.get('name')} ({c.get('role')})" for c in p.get("contacts", [])
                )
                or "—",
            ]
            for p in prospects
        ],
    )
    if listing.get("excluded"):
        lines += ["### Excluded", ""]
        lines += [f"- {x}" for x in listing["excluded"]] + [""]
    return lines


def _campaign_section(campaign: dict[str, Any]) -> list[str]:
    lines = [f"## Campaign — {campaign.get('name', '?')}", ""]
    lines += [f"**Thesis:** {campaign.get('thesis', '—')}", ""]
    lines += [f"**Segment:** {campaign.get('segment', '—')}", ""]

    if campaign.get("success_metrics"):
        lines += ["**Targets:** " + ", ".join(
            f"{k.replace('_', ' ')} {v}" for k, v in campaign["success_metrics"].items()
        ), ""]

    lines += ["### Email sequence", ""]
    for email in sorted(campaign.get("emails", []), key=lambda e: (e.get("prospect_id", ""), e.get("step", 0))):
        lines += [
            f"**Day {email.get('send_offset_days', 0)} · step {email.get('step')} "
            f"· {email.get('prospect_id')}**",
            "",
            f"Subject: {email.get('subject', '')}",
            "",
            email.get("body", ""),
            "",
            f"_{email.get('opt_out_line', '')}_",
            "",
            f"<sub>Personalisation source: {email.get('personalisation_source', '—')}</sub>",
            "",
        ]

    for call in campaign.get("calls", []):
        lines += [f"### Call script — {call.get('prospect_id')}", ""]
        lines += [f"**Objective:** {call.get('objective', '—')}", ""]
        lines += [f"**Opener:** {call.get('opener', '—')}", ""]
        lines += ["**Ask:**", ""] + [f"- {q}" for q in call.get("discovery_questions", [])] + [""]
        for objection, answer in (call.get("objection_handling") or {}).items():
            lines += [f"- _\"{objection}\"_ → {answer}"]
        lines += ["", f"**Close:** {call.get('close', '—')}", ""]

    lines += ["### Social calendar", ""]
    lines += _table(
        ["Day", "Channel", "Pillar", "Hook", "Asset needed"],
        [
            [
                str(post.get("publish_offset_days", 0)),
                post.get("channel", "?"),
                post.get("pillar", "—"),
                post.get("hook", "—"),
                post.get("asset_brief", "—"),
            ]
            for post in sorted(
                campaign.get("social", []), key=lambda s: s.get("publish_offset_days", 0)
            )
        ],
    )
    if campaign.get("compliance_notes"):
        lines += [f"**Compliance:** {campaign['compliance_notes']}", ""]
    return lines


def render_job(job: dict[str, Any]) -> str:
    """Render a portal job — same sections, header built from the stage gates."""
    stages = job.get("stages", {})
    lines = [f"# {job.get('id', 'job')}", ""]
    rows = []
    for stage in ("funding", "clients", "outreach"):
        state = stages.get(stage) or {}
        chosen = next(
            (
                r
                for r in state.get("rounds", [])
                if r.get("number") == state.get("selected_round")
            ),
            None,
        )
        rows.append(
            [
                stage,
                state.get("status", "pending"),
                f"{chosen['score']:.0f}" if chosen else "—",
                str(len(state.get("rounds", []))),
                state.get("reason", "") or "—",
            ]
        )
    lines += _table(["Stage", "Gate", "Score", "Rounds", "Why the loop stopped"], rows)

    def artifact(stage: str) -> Optional[dict[str, Any]]:
        state = stages.get(stage) or {}
        return next(
            (
                r.get("artifact")
                for r in state.get("rounds", [])
                if r.get("number") == state.get("selected_round")
            ),
            None,
        )

    if artifact("funding"):
        lines += _funding_section(artifact("funding"))
    if artifact("clients"):
        lines += _prospect_section(artifact("clients"))
    if artifact("outreach"):
        lines += _campaign_section(artifact("outreach"))
    return "\n".join(lines) + "\n"


def render_run(run_dir: Path) -> str:
    """Render one run directory as a markdown digest."""
    summary = _load(run_dir, "run") or {}
    lines = _header(summary)

    funding = _load(run_dir, "funding")
    if funding:
        lines += _funding_section(funding)

    prospects = _load(run_dir, "prospects")
    if prospects:
        lines += _prospect_section(prospects)

    campaign = _load(run_dir, "campaign")
    if campaign:
        lines += _campaign_section(campaign)

    lines += ["---", f"<sub>Generated from {run_dir}</sub>"]
    return "\n".join(lines) + "\n"
