"""Command line entry point.

    python -m aigency_crew.main run --dry-run     # loop mechanics, no API calls
    python -m aigency_crew.main run               # the real thing
    python -m aigency_crew.main stage funding
    python -m aigency_crew.main report
    python -m aigency_crew.main ledger show
    python -m aigency_crew.main ledger record --campaign q3-launch --sent 120 --replies 11

CrewAI is imported lazily, so ``--dry-run`` and the ledger commands work in an
environment where only the light dependencies are installed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from .reporting import latest_run, render_run
from .settings import ledger_path, load_settings, output_dir
from .demo import demo_workstreams
from .engine import STAGES, GrowthEngine, RunResult
from .ledger import Ledger


def _reporter(quiet: bool):
    if quiet:
        return lambda _msg: None
    return lambda msg: print(msg, flush=True)


def _build_engine(dry_run: bool, quiet: bool, cycles: Optional[int]) -> GrowthEngine:
    settings = load_settings()
    if cycles is not None:
        settings.max_cycles = cycles
    ledger = Ledger.load(ledger_path())
    reporter = _reporter(quiet)

    if dry_run:
        reporter("dry run — scripted agents, no model calls, no network")
        return GrowthEngine(settings, ledger, demo_workstreams(), reporter=reporter)

    from .crews import clients_workstream, funding_workstream, outreach_workstream

    return GrowthEngine(
        settings,
        ledger,
        {
            "funding": funding_workstream(settings, ledger, verbose=not quiet),
            "clients": clients_workstream(settings, ledger, verbose=not quiet),
            "outreach": outreach_workstream(settings, ledger, verbose=not quiet),
        },
        reporter=reporter,
    )


def cmd_run(args: argparse.Namespace) -> int:
    engine = _build_engine(args.dry_run, args.quiet, args.cycles)
    result = engine.run(cycles=args.cycles)
    written = engine.write_outputs(result)

    print("\n" + json.dumps(result.summary(), indent=2, default=str))
    print("\nwritten:")
    for name, path in written.items():
        print(f"  {name}: {path}")
    if result.needs_human:
        print("\nSome stages escalated. They are saved with their best draft and the")
        print("reason the loop stopped — review those before sending anything.")
    return 0


def cmd_stage(args: argparse.Namespace) -> int:
    engine = _build_engine(args.dry_run, args.quiet, None)
    result = engine.run_stage(args.stage)
    engine.ledger.save()

    # A stage run is as expensive as a third of a full run; it must not
    # evaporate into the terminal scrollback.
    run = RunResult(run_id=engine.run_id, cycles_run=1, outcomes=[result.outcome])
    setattr(run, {"funding": "funding", "clients": "prospects", "outreach": "campaign"}[args.stage], result.artifact)
    written = engine.write_outputs(run)

    print("\n" + json.dumps(result.outcome.model_dump(), indent=2, default=str))
    print("\nwritten:")
    for name, path in written.items():
        print(f"  {name}: {path}")
    if result.outcome.escalated:
        print("\nThis stage escalated — read it before acting on it.")
    return 0


def cmd_flow(args: argparse.Namespace) -> int:
    from .flow import AigencyGrowthFlow, build_engine

    settings = load_settings()
    ledger = Ledger.load(ledger_path())
    engine = (
        GrowthEngine(settings, ledger, demo_workstreams(), reporter=_reporter(args.quiet))
        if args.dry_run
        else build_engine(settings, ledger, verbose=not args.quiet)
    )
    flow = AigencyGrowthFlow(engine=engine)
    if args.plot:
        flow.plot("aigency_growth_flow")
        print("wrote aigency_growth_flow.html")
        return 0
    result = flow.kickoff()
    print("\n" + json.dumps(result.summary(), indent=2, default=str))
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    run_dir = (output_dir() / args.run) if args.run else latest_run()
    if run_dir is None or not run_dir.exists():
        print("No runs found. Try: aigency-crew run --dry-run")
        return 1

    markdown = render_run(run_dir)
    destination = Path(args.out) if args.out else run_dir / "report.md"
    destination.write_text(markdown, encoding="utf-8")

    if args.print:
        print(markdown)
    else:
        print(f"wrote {destination}")
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    try:
        from .portal.app import serve
    except ImportError as exc:
        print(
            "The portal needs its extra dependencies:\n"
            '  pip install -e ".[portal]"\n'
            f"({exc})"
        )
        return 1

    print(f"portal on http://{args.host}:{args.port}")
    serve(host=args.host, port=args.port, reload=args.reload)
    return 0


def cmd_ledger(args: argparse.Namespace) -> int:
    ledger = Ledger.load(ledger_path())

    if args.ledger_command == "show":
        print(f"ledger: {ledger.path}")
        for stage in STAGES:
            print(f"\n--- {stage} ---")
            print(f"learnings ({len(ledger.learnings(stage))}):")
            print(ledger.briefing(stage, limit=50))
            print(f"ids delivered so far: {len(ledger.seen(stage))}")
        print("\n--- campaign performance ---")
        print(ledger.performance_brief())
        last = ledger.last_run()
        if last:
            print(f"\nlast run: {last['run_id']} at {last['at']}")
        return 0

    if args.ledger_command == "record":
        ledger.record_outcome(
            args.campaign,
            sent=args.sent,
            replies=args.replies,
            meetings=args.meetings,
            won=args.won,
            segment=args.segment,
        )
        ledger.save()
        print(f"recorded results for {args.campaign}")
        print(ledger.performance_brief())
        return 0

    if args.ledger_command == "learn":
        added = ledger.add_learnings(args.stage, [args.note])
        ledger.save()
        print(f"{added} learning(s) added to {args.stage}")
        return 0

    return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="aigency-crew",
        description="Six-agent growth engine: funding research, client pipeline, "
        "and outreach campaigns, each double-checked by its own auditor.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--dry-run", action="store_true", help="scripted agents, no model calls")
    common.add_argument("--quiet", action="store_true", help="suppress progress output")

    run = sub.add_parser("run", parents=[common], help="run the full engine")
    run.add_argument("--cycles", type=int, default=None, help="override the cycle budget")
    run.set_defaults(func=cmd_run)

    stage = sub.add_parser("stage", parents=[common], help="run one workstream only")
    stage.add_argument("stage", choices=STAGES)
    stage.set_defaults(func=cmd_stage)

    flow = sub.add_parser("flow", parents=[common], help="run via the CrewAI Flow")
    flow.add_argument("--plot", action="store_true", help="write the flow diagram and exit")
    flow.set_defaults(func=cmd_flow)

    report = sub.add_parser("report", help="render a finished run as readable markdown")
    report.add_argument("--run", default=None, help="run id (default: the most recent)")
    report.add_argument("--out", default=None, help="write here instead of <run>/report.md")
    report.add_argument("--print", action="store_true", help="print to stdout as well")
    report.set_defaults(func=cmd_report)

    serve_cmd = sub.add_parser("serve", help="run the portal: launch, gate and review runs")
    serve_cmd.add_argument("--host", default="127.0.0.1")
    serve_cmd.add_argument("--port", type=int, default=8000)
    serve_cmd.add_argument("--reload", action="store_true", help="reload on code changes")
    serve_cmd.set_defaults(func=cmd_serve)

    ledger = sub.add_parser("ledger", help="inspect or feed the engine's memory")
    ledger_sub = ledger.add_subparsers(dest="ledger_command", required=True)
    ledger_sub.add_parser("show", help="print learnings, delivered ids and performance")

    record = ledger_sub.add_parser("record", help="log what a sent campaign actually did")
    record.add_argument("--campaign", required=True)
    record.add_argument("--segment", default="")
    record.add_argument("--sent", type=int, default=0)
    record.add_argument("--replies", type=int, default=0)
    record.add_argument("--meetings", type=int, default=0)
    record.add_argument("--won", type=int, default=0)

    learn = ledger_sub.add_parser("learn", help="add a rule by hand")
    learn.add_argument("--stage", choices=STAGES, required=True)
    learn.add_argument("--note", required=True)

    ledger.set_defaults(func=cmd_ledger)
    return parser


def cli(argv: Optional[list[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(cli())
