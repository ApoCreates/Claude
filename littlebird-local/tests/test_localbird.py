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


def test_action_item_extraction_fallback(db, tmp_path):
    """Offline, tasks are parsed from the summary's checkbox lines."""
    from localbird.memory import Memory
    from localbird.transcription import MeetingService
    svc = MeetingService(db, Memory(db))
    summary = (
        "## Action items\n"
        "- [ ] Send revised budget — owner: Dana — due: Tuesday\n"
        "- [ ] Book venue — owner: unassigned — due: none\n"
    )
    tasks = svc._extract_tasks(summary, "Planning call", meeting_id=1)
    texts = [t["task"] for t in tasks]
    assert "Send revised budget" in texts
    assert "Book venue" in texts
    dana = next(t for t in tasks if t["task"] == "Send revised budget")
    assert dana["owner"] == "Dana" and dana["due"] == "Tuesday"
    unassigned = next(t for t in tasks if t["task"] == "Book venue")
    assert unassigned["owner"] is None and unassigned["due"] is None
    assert len(db.tasks()) == 2


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
