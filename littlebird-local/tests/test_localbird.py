"""Tests that run fully offline (no Ollama, no network).

They exercise the storage, embedding-fallback, semantic retrieval, chat RAG,
journals and routine scheduling paths — i.e. everything that must work even
before you install local models.
"""

import time
from pathlib import Path

import pytest

# Point the app at a throwaway data dir BEFORE importing config-bound modules.
import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="localbird-test-")
os.environ["LOCALBIRD_HOME"] = _TMP
os.environ["LOCALBIRD_OFFLINE_FALLBACK"] = "true"

from localbird.db import Database          # noqa: E402
from localbird.memory import Memory        # noqa: E402
from localbird.chat import ChatEngine      # noqa: E402
from localbird.journals import Journal     # noqa: E402
from localbird.routines import Routines    # noqa: E402
from localbird.llm import llm, unpack      # noqa: E402
from localbird.capture import privacy      # noqa: E402


@pytest.fixture()
def db(tmp_path):
    return Database(tmp_path / "t.db")


def test_offline_embed_is_stable_and_normalised():
    a = unpack(llm.embed("quarterly revenue report"))
    b = unpack(llm.embed("quarterly revenue report"))
    assert a == b               # deterministic
    assert len(a) == 384
    norm = sum(x * x for x in a) ** 0.5
    assert 0.9 < norm < 1.1     # roughly unit length


def test_memory_roundtrip_and_search(db):
    mem = Memory(db)
    mem.remember("The Falcon project ships in October. Owner is Priya.",
                 kind="observation", source="Notion", title="Falcon plan")
    mem.remember("Grocery list: milk, eggs, bread.", kind="note", source="Notes")
    hits = mem.search("when does falcon ship")
    assert hits, "expected at least one retrieval hit"
    assert "Falcon" in hits[0].text


def test_search_empty_query_returns_nothing(db):
    assert Memory(db).search("   ") == []


def test_chat_uses_context_offline(db):
    mem = Memory(db)
    mem.remember("Deploy window is Saturday 2am UTC per the ops runbook.",
                 kind="observation", source="Confluence")
    chat = ChatEngine(db, mem)
    res = chat.ask("what's the deploy window?")
    assert res["sources"], "chat should cite retrieved memories"
    # In offline mode the answer echoes the relevant context.
    assert "Saturday" in res["answer"] or "Saturday" in str(res["sources"])


def test_journal_generates_from_observations(db):
    mem = Memory(db)
    now = time.time()
    mem.remember("Wrote the LocalBird README and fixed the capture loop.",
                 kind="observation", source="VS Code", ts=now)
    out = Journal(db, mem).generate(now)
    assert out["fragment_count"] >= 1
    assert out["entry"]


def test_privacy_redaction_and_exclusion():
    assert "[redacted" in privacy.redact("password: hunter2")
    assert "[redacted-card]" in privacy.redact("card 4111 1111 1111 1111")
    assert privacy.app_excluded("1Password 7")
    assert not privacy.should_capture("Safari", "Sign in", "short")


def test_routine_scheduling_window(db):
    mem = Memory(db)
    chat = ChatEngine(db, mem)
    routines = Routines(db, chat)
    rid = db.add_routine("Test", "summarise today", "daily", hour=0, minute=0)
    # Just after midnight it should be due; after running, not due again today.
    due = routines.due(now=time.time())
    assert rid in due
    routines.run(rid)
    assert rid not in routines.due(now=time.time())


def test_task_crud(db):
    tid = db.add_task("Send the Falcon deck", owner="Priya", due="Friday",
                      source="Falcon sync")
    tasks = db.tasks()
    assert any(t["id"] == tid for t in tasks)
    db.set_task_done(tid, True)
    assert not db.tasks(include_done=False)
    assert db.tasks(include_done=True)[0]["done"] == 1
    db.delete_task(tid)
    assert not db.tasks(include_done=True)


def test_next_steps_parser():
    """Zoom-companion-style per-person 'Next steps' sections parse into tasks."""
    from localbird.transcription import parse_next_steps
    summary = (
        "## Quick recap\nIntro call about the rebrand.\n\n"
        "## Next steps\n"
        "### Abdullah\n"
        "- Send an animated sample to Mahan in the next couple of days\n"
        "- Provide a full detailed storyboard for phase one\n"
        "### Lefki\n"
        "- Create a tracker for assets and deliverables\n"
        "### Collaboration\n"
        "- Lefki and Monica: schedule a catch-up early next week\n"
        "### Unassigned\n"
        "- Book the studio\n\n"
        "## Summary\n### Kickoff\nDetails here.\n"
    )
    items = parse_next_steps(summary)
    by_task = {i["task"]: i for i in items}
    assert by_task["Create a tracker for assets and deliverables"]["owner"] == "Lefki"
    assert by_task["Send an animated sample to Mahan in the next couple of days"]["owner"] == "Abdullah"
    assert by_task["Book the studio"]["owner"] is None
    assert by_task["Lefki and Monica: schedule a catch-up early next week"]["owner"] is None
    assert len(items) == 5


def test_action_item_extraction_fallback(db, tmp_path):
    """Offline, tasks are parsed deterministically from the summary."""
    from localbird.memory import Memory
    from localbird.transcription import MeetingService
    svc = MeetingService(db, Memory(db))
    summary = (
        "## Next steps\n"
        "### Dana\n- Send revised budget by Tuesday\n"
        "## Action items\n"
        "- [ ] Book venue — owner: unassigned — due: none\n"
    )
    tasks = svc._extract_tasks(summary, "Planning call", meeting_id=1)
    by_task = {t["task"]: t for t in tasks}
    assert by_task["Send revised budget by Tuesday"]["owner"] == "Dana"
    assert by_task["Book venue"]["owner"] is None
    assert len(db.tasks()) == 2


def test_task_feedback_learning(db):
    """Deleting an auto-suggested task teaches rejection; completing teaches
    acceptance; manual tasks generate no feedback."""
    auto = db.add_task("Reply to the WAD image bank email", source="screen · Mail")
    db.delete_task(auto)
    rejected = [r["text"] for r in db.task_feedback("rejected")]
    assert "Reply to the WAD image bank email" in rejected

    kept = db.add_task("Send storyboard to Safiyyah", source="screen · Notes")
    db.set_task_done(kept, True)
    accepted = [r["text"] for r in db.task_feedback("accepted")]
    assert "Send storyboard to Safiyyah" in accepted

    manual = db.add_task("My own note", source="manual")
    db.delete_task(manual)
    assert len(db.task_feedback("rejected")) == 1  # unchanged


def test_rejected_filter_blocks_similar_suggestions():
    from localbird.insights import filter_rejected
    rejected = ["Reply to the marketing newsletter about growth tips"]
    items = [
        {"task": "Reply to marketing newsletter about growth tips today"},
        {"task": "Send the phase one storyboard to Safiyyah"},
    ]
    out = filter_rejected(items, rejected)
    assert len(out) == 1
    assert out[0]["task"].startswith("Send the phase one storyboard")


def test_insights_dedupe_similarity():
    from localbird.insights import similar
    assert similar("Send the revised budget to Dana",
                   "send revised budget to Dana by Tuesday")
    assert not similar("Send the revised budget to Dana",
                       "Book flights for the conference in Berlin")
    assert not similar("", "anything")


def test_connector_record_parsing():
    from localbird.connectors import applescript as osa
    raw = f"id1{osa.FIELD}Subject A{osa.FIELD}a@b.c{osa.FIELD}Mon{osa.FIELD}Body{osa.RECORD}" \
          f"id2{osa.FIELD}Subject B{osa.FIELD}d@e.f{osa.FIELD}Tue{osa.FIELD}Body2{osa.RECORD}"
    recs = osa.parse_records(raw)
    assert len(recs) == 2
    assert recs[0][0] == "id1" and recs[1][1] == "Subject B"


def test_meetingwatch_status_offline(db):
    """The watcher must construct and report status off-macOS."""
    from localbird.capture import CaptureEngine
    from localbird.meetingwatch import MeetingWatcher
    from localbird.memory import Memory
    from localbird.transcription import MeetingService
    mem = Memory(db)
    watcher = MeetingWatcher(MeetingService(db, mem), CaptureEngine(mem))
    st = watcher.status()
    assert st["in_meeting"] is False
    assert "mode" in st


def test_forget_deletes_recent(db):
    mem = Memory(db)
    mem.remember("ephemeral thing to forget", kind="note")
    assert db.count_memories() >= 1
    deleted = db.delete_memories_since(time.time() - 3600)
    assert deleted >= 1
    assert db.count_memories() == 0
