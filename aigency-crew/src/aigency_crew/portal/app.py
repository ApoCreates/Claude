"""The portal: a browser front end for driving the six agents.

Launch a run, watch it work, read what each stage produced round by round,
send a stage back with an instruction, revert to an earlier round, rate the
output, download it — and, above all, approve each stage before the next agent
is allowed to build on it.

Server-rendered HTML with a small polling script. No build step, no bundler,
nothing to deploy: `aigency-crew serve` and open the page.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from ..demo import demo_workstreams
from ..engine import STAGES, GrowthEngine
from ..ledger import Ledger
from ..reporting import render_job
from ..settings import ledger_path, load_settings, project_root
from .jobs import APPROVED, AWAITING, FAILED, PENDING, REJECTED, RUNNING, Job, JobRunner, JobStore

HERE = Path(__file__).resolve().parent


def build_engine_factory(dry_run: bool, params: dict[str, Any]):
    """A fresh engine per stage run, so settings edits take effect immediately."""

    def factory() -> GrowthEngine:
        settings = load_settings()
        for key in ("region", "campaign_goal"):
            if params.get(key):
                setattr(settings, key, params[key])
        for key in ("funding_target_count", "prospect_target_count"):
            if params.get(key):
                setattr(settings, key, int(params[key]))

        ledger = Ledger.load(ledger_path())
        if dry_run:
            return GrowthEngine(settings, ledger, demo_workstreams())

        from ..crews import clients_workstream, funding_workstream, outreach_workstream

        return GrowthEngine(
            settings,
            ledger,
            {
                "funding": funding_workstream(settings, ledger, verbose=False),
                "clients": clients_workstream(settings, ledger, verbose=False),
                "outreach": outreach_workstream(settings, ledger, verbose=False),
            },
        )

    return factory


def create_app(jobs_root: Optional[Path] = None) -> FastAPI:
    app = FastAPI(title="The Aigency — agent portal", docs_url="/api/docs")
    store = JobStore(jobs_root or project_root() / "state" / "jobs")
    templates = Jinja2Templates(directory=str(HERE / "templates"))
    app.mount("/static", StaticFiles(directory=str(HERE / "static")), name="static")

    runners: dict[str, JobRunner] = {}

    def runner_for(job: Job) -> JobRunner:
        """One runner per job, so its progress log survives between requests."""
        if job.id not in runners:
            runners[job.id] = JobRunner(
                store, build_engine_factory(bool(job.params.get("dry_run")), job.params)
            )
        return runners[job.id]

    def get_job(job_id: str) -> Job:
        job = store.load(job_id)
        if job is None:
            raise HTTPException(404, f"no such job: {job_id}")
        return job

    def back_to(job_id: str) -> RedirectResponse:
        return RedirectResponse(f"/jobs/{job_id}", status_code=303)

    # -- pages -------------------------------------------------------------

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request):
        settings = load_settings()
        return templates.TemplateResponse(
            request,
            "index.html",
            {
                "jobs": store.list(),
                "settings": settings,
                "has_key": bool(__import__("os").getenv("ANTHROPIC_API_KEY")),
                "has_search": bool(__import__("os").getenv("SERPER_API_KEY")),
            },
        )

    @app.get("/jobs/{job_id}", response_class=HTMLResponse)
    def job_detail(request: Request, job_id: str):
        job = get_job(job_id)
        return templates.TemplateResponse(
            request,
            "job.html",
            {
                "job": job,
                "stages": STAGES,
                "progress": runner_for(job).progress(job_id),
                "statuses": {
                    "PENDING": PENDING,
                    "RUNNING": RUNNING,
                    "AWAITING": AWAITING,
                    "APPROVED": APPROVED,
                    "REJECTED": REJECTED,
                    "FAILED": FAILED,
                },
            },
        )

    @app.get("/ledger", response_class=HTMLResponse)
    def ledger_page(request: Request):
        ledger = Ledger.load(ledger_path())
        return templates.TemplateResponse(
            request,
            "ledger.html",
            {
                "learnings": {s: ledger.learnings(s) for s in STAGES},
                "seen": {s: len(ledger.seen(s)) for s in STAGES},
                "performance": ledger.performance_brief(),
                "outcomes": ledger.data.get("outcomes", {}),
            },
        )

    # -- actions -----------------------------------------------------------

    @app.post("/jobs")
    def create_job(
        region: str = Form(""),
        campaign_goal: str = Form(""),
        funding_target_count: str = Form(""),
        prospect_target_count: str = Form(""),
        dry_run: str = Form(""),
    ):
        job = Job.create(
            {
                "region": region.strip(),
                "campaign_goal": campaign_goal.strip(),
                "funding_target_count": funding_target_count.strip(),
                "prospect_target_count": prospect_target_count.strip(),
                "dry_run": bool(dry_run),
            }
        )
        store.save(job)
        runner_for(job).start_stage(job, STAGES[0])
        return back_to(job.id)

    @app.post("/jobs/{job_id}/stages/{stage}/run")
    def run_stage(job_id: str, stage: str):
        job = get_job(job_id)
        try:
            runner_for(job).start_stage(job, stage)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc
        return back_to(job_id)

    @app.post("/jobs/{job_id}/stages/{stage}/approve")
    def approve(job_id: str, stage: str, note: str = Form(""), hold: str = Form("")):
        job = get_job(job_id)
        try:
            runner_for(job).approve(job, stage, note, auto_start_next=not hold)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc
        return back_to(job_id)

    @app.post("/jobs/{job_id}/stages/{stage}/reject")
    def reject(job_id: str, stage: str, note: str = Form(...), rerun: str = Form("1")):
        job = get_job(job_id)
        try:
            runner_for(job).reject(job, stage, note, rerun=bool(rerun))
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc
        return back_to(job_id)

    @app.post("/jobs/{job_id}/stages/{stage}/revert")
    def revert(job_id: str, stage: str, round_number: int = Form(...)):
        job = get_job(job_id)
        try:
            runner_for(job).revert(job, stage, round_number)
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc
        return back_to(job_id)

    @app.post("/jobs/{job_id}/stages/{stage}/evaluate")
    def evaluate(
        job_id: str,
        stage: str,
        score: str = Form(""),
        notes: str = Form(""),
    ):
        job = get_job(job_id)
        parsed = float(score) if score.strip() else None
        runner_for(job).evaluate(job, stage, parsed, notes, ledger=Ledger.load(ledger_path()))
        return back_to(job_id)

    @app.post("/jobs/{job_id}/delete")
    def delete_job(job_id: str):
        store.delete(job_id)
        runners.pop(job_id, None)
        return RedirectResponse("/", status_code=303)

    @app.post("/ledger/outcome")
    def record_outcome(
        campaign: str = Form(...),
        segment: str = Form(""),
        sent: int = Form(0),
        replies: int = Form(0),
        meetings: int = Form(0),
        won: int = Form(0),
    ):
        ledger = Ledger.load(ledger_path())
        ledger.record_outcome(
            campaign, sent=sent, replies=replies, meetings=meetings, won=won, segment=segment
        )
        ledger.save()
        return RedirectResponse("/ledger", status_code=303)

    # -- data out ----------------------------------------------------------

    @app.get("/api/jobs/{job_id}")
    def job_json(job_id: str):
        job = get_job(job_id)
        return JSONResponse(
            {**job.to_dict(), "progress": runner_for(job).progress(job_id)}
        )

    @app.get("/jobs/{job_id}/download/{stage}.json")
    def download_stage(job_id: str, stage: str):
        job = get_job(job_id)
        artifact = job.stages[stage].artifact
        if artifact is None:
            raise HTTPException(404, f"{stage} has produced nothing yet")
        return JSONResponse(
            artifact,
            headers={
                "Content-Disposition": f'attachment; filename="{job_id}-{stage}.json"'
            },
        )

    @app.get("/jobs/{job_id}/download/round/{stage}/{round_number}.json")
    def download_round(job_id: str, stage: str, round_number: int):
        job = get_job(job_id)
        record = next(
            (r for r in job.stages[stage].rounds if r.number == round_number), None
        )
        if record is None:
            raise HTTPException(404, f"{stage} has no round {round_number}")
        return JSONResponse(
            record.artifact,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{job_id}-{stage}-round{round_number}.json"'
                )
            },
        )

    @app.get("/jobs/{job_id}/report.md")
    def download_report(job_id: str):
        job = get_job(job_id)
        return PlainTextResponse(
            render_job(job.to_dict()),
            headers={"Content-Disposition": f'attachment; filename="{job_id}-report.md"'},
        )

    @app.get("/jobs/{job_id}/report", response_class=HTMLResponse)
    def view_report(request: Request, job_id: str):
        job = get_job(job_id)
        return templates.TemplateResponse(
            request,
            "report.html",
            {"job": job, "markdown": render_job(job.to_dict())},
        )

    @app.get("/api/jobs")
    def list_jobs():
        return JSONResponse([j.to_dict() for j in store.list()])

    return app


def serve(host: str = "127.0.0.1", port: int = 8000, reload: bool = False) -> None:
    import uvicorn

    uvicorn.run("aigency_crew.portal.app:create_app", factory=True, host=host, port=port, reload=reload)
