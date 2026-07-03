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


def test_forget_deletes_recent(db):
    mem = Memory(db)
    mem.remember("ephemeral thing to forget", kind="note")
    assert db.count_memories() >= 1
    deleted = db.delete_memories_since(time.time() - 3600)
    assert deleted >= 1
    assert db.count_memories() == 0
