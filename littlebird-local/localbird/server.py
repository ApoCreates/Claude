"""FastAPI server exposing the whole app + the web dashboard.

Everything binds to localhost by default. There are no accounts, tokens or
quotas — this is your machine talking to itself.
"""

from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .app import get_app
from .config import settings

UI_DIR = Path(__file__).resolve().parent.parent / "ui"

api = FastAPI(title="LocalBird", version="1.0.0")


@api.on_event("startup")
def _startup() -> None:
    get_app().start()


# ---- schemas ---------------------------------------------------------
class AskBody(BaseModel):
    question: str
    top_k: int | None = None


class SearchBody(BaseModel):
    query: str
    top_k: int | None = None


class NoteBody(BaseModel):
    text: str
    title: str | None = None
    source: str | None = None


class RoutineBody(BaseModel):
    name: str
    prompt: str
    cadence: str = "daily"
    hour: int = 8
    minute: int = 0
    weekday: int = 0
    day: int = 1


class ImageBody(BaseModel):
    prompt: str
    width: int = 768
    height: int = 768
    steps: int = 28
    negative: str = ""


class TranscriptBody(BaseModel):
    transcript: str
    title: str | None = None


# ---- status ----------------------------------------------------------
@api.get("/api/status")
def status():
    return get_app().status()


@api.get("/api/health")
def health():
    return {"ok": True, "ts": time.time()}


# ---- chat + memory ---------------------------------------------------
@api.post("/api/ask")
def ask(body: AskBody):
    if not body.question.strip():
        raise HTTPException(400, "question is required")
    return get_app().chat.ask(body.question, top_k=body.top_k)


@api.post("/api/search")
def search(body: SearchBody):
    hits = get_app().memory.search(body.query, top_k=body.top_k)
    return {"results": [
        {"id": h.id, "kind": h.kind, "source": h.source, "title": h.title,
         "ts": h.ts, "score": round(h.score, 3), "text": h.text}
        for h in hits
    ]}


@api.get("/api/chats")
def chats():
    rows = get_app().db.recent_chats(limit=50)
    return {"chats": [dict(r) for r in rows]}


@api.post("/api/note")
def add_note(body: NoteBody):
    ids = get_app().memory.remember(body.text, kind="note",
                                    source=body.source or "note", title=body.title)
    return {"ok": True, "ids": ids}


@api.get("/api/timeline")
def timeline(hours: float = 24):
    app = get_app()
    since = time.time() - hours * 3600
    rows = app.db.recent_memories(since)
    return {"items": [
        {"id": r["id"], "kind": r["kind"], "source": r["source"],
         "title": r["title"], "ts": r["ts"], "excerpt": r["text"][:240]}
        for r in reversed(rows)
    ][:400]}


# ---- capture control -------------------------------------------------
@api.post("/api/capture/pause")
def capture_pause():
    get_app().capture.pause()
    return {"ok": True, "paused": True}


@api.post("/api/capture/resume")
def capture_resume():
    get_app().capture.resume()
    return {"ok": True, "paused": False}


@api.post("/api/capture/forget")
def capture_forget(hours: float = Form(1.0)):
    n = get_app().db.delete_memories_since(time.time() - hours * 3600)
    return {"ok": True, "deleted": n}


@api.post("/api/wipe")
def wipe():
    get_app().db.wipe()
    return {"ok": True}


# ---- meetings --------------------------------------------------------
@api.get("/api/meetings")
def meetings():
    rows = get_app().db.meetings()
    return {"meetings": [
        {"id": r["id"], "title": r["title"], "summary": r["summary"],
         "duration_s": r["duration_s"], "ts": r["ts"]}
        for r in rows
    ]}


@api.get("/api/meetings/{meeting_id}")
def meeting(meeting_id: int):
    row = get_app().db.meeting(meeting_id)
    if not row:
        raise HTTPException(404, "not found")
    return dict(row)


@api.post("/api/meetings/upload")
async def meetings_upload(file: UploadFile = File(...), title: str = Form(None)):
    app = get_app()
    dest = settings.audio_dir / f"upload-{int(time.time())}-{file.filename}"
    dest.write_bytes(await file.read())
    result = app.meetings.ingest_audio(dest, title=title)
    if not result.get("ok"):
        return JSONResponse(result, status_code=422)
    return result


@api.post("/api/meetings/transcript")
def meetings_transcript(body: TranscriptBody):
    return get_app().meetings.ingest_text(body.transcript, title=body.title)


@api.post("/api/meetings/record/start")
def record_start():
    return get_app().meetings.start_recording()


@api.post("/api/meetings/record/stop")
def record_stop(title: str = Form(None)):
    return get_app().meetings.stop_recording(title=title)


# ---- journals --------------------------------------------------------
@api.post("/api/journal/today")
def journal_today():
    return get_app().journal.generate()


@api.post("/api/journal/day")
def journal_day(day_ts: float = Form(...)):
    return get_app().journal.generate(day_ts)


# ---- routines --------------------------------------------------------
@api.get("/api/routines")
def routines_list():
    app = get_app()
    out = []
    for r in app.db.routines():
        runs = app.db.routine_runs(r["id"], limit=1)
        out.append({**dict(r), "last_output": runs[0]["output"] if runs else None})
    return {"routines": out}


@api.post("/api/routines")
def routines_create(body: RoutineBody):
    rid = get_app().db.add_routine(
        body.name, body.prompt, body.cadence, hour=body.hour, minute=body.minute,
        weekday=body.weekday, day=body.day)
    return {"ok": True, "id": rid}


@api.post("/api/routines/{routine_id}/run")
def routines_run(routine_id: int):
    try:
        return get_app().routines.run(routine_id)
    except KeyError:
        raise HTTPException(404, "routine not found")


@api.post("/api/routines/{routine_id}/toggle")
def routines_toggle(routine_id: int, enabled: bool = Form(...)):
    get_app().db.update_routine(routine_id, enabled=1 if enabled else 0)
    return {"ok": True}


@api.delete("/api/routines/{routine_id}")
def routines_delete(routine_id: int):
    get_app().db.delete_routine(routine_id)
    return {"ok": True}


@api.get("/api/routines/{routine_id}/runs")
def routines_runs(routine_id: int):
    rows = get_app().db.routine_runs(routine_id, limit=30)
    return {"runs": [dict(r) for r in rows]}


# ---- images ----------------------------------------------------------
@api.post("/api/images")
def images(body: ImageBody):
    return get_app().images.generate(body.prompt, width=body.width,
                                     height=body.height, steps=body.steps,
                                     negative=body.negative)


@api.get("/api/images/file")
def image_file(path: str):
    p = Path(path)
    if not p.is_file() or settings.image_dir not in p.resolve().parents:
        raise HTTPException(404, "not found")
    return FileResponse(str(p))


# ---- static UI (mounted last so /api/* wins) -------------------------
if UI_DIR.exists():
    api.mount("/", StaticFiles(directory=str(UI_DIR), html=True), name="ui")


def main() -> None:
    import uvicorn
    print(f"\n  LocalBird → http://{settings.host}:{settings.port}\n")
    uvicorn.run(api, host=settings.host, port=settings.port, log_level="info")


if __name__ == "__main__":
    main()
