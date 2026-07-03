"""SQLite storage layer.

A single local database file holds every kind of record LocalBird keeps:
captured window text ("observations"), meeting transcripts, chat history,
journals and routines. Embeddings are stored as raw float32 blobs alongside
each memory row so semantic search needs no external vector service.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Iterable

SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    kind       TEXT NOT NULL,              -- observation | meeting | note | journal
    source     TEXT,                       -- app name / window / file / "meeting"
    title      TEXT,
    text       TEXT NOT NULL,
    meta       TEXT,                        -- JSON blob
    embedding  BLOB,                        -- float32 vector
    ts         REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memories_ts ON memories(ts);
CREATE INDEX IF NOT EXISTS idx_memories_kind ON memories(kind);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    text, title, source
);

CREATE TABLE IF NOT EXISTS chats (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    role    TEXT NOT NULL,                  -- user | assistant
    content TEXT NOT NULL,
    sources TEXT,                            -- JSON list of memory ids used
    ts      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    prompt     TEXT NOT NULL,
    cadence    TEXT NOT NULL,               -- daily | weekly | monthly
    hour       INTEGER NOT NULL DEFAULT 8,
    minute     INTEGER NOT NULL DEFAULT 0,
    weekday    INTEGER DEFAULT 0,           -- 0=Mon for weekly
    day        INTEGER DEFAULT 1,           -- day-of-month for monthly
    enabled    INTEGER NOT NULL DEFAULT 1,
    last_run   REAL,
    created_ts REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_runs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    output     TEXT NOT NULL,
    ts         REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT,
    transcript TEXT NOT NULL,
    summary    TEXT,
    audio_path TEXT,
    duration_s REAL,
    ts         REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT NOT NULL,
    owner      TEXT,
    due        TEXT,
    source     TEXT,                        -- meeting title / "manual" / routine
    meeting_id INTEGER,
    done       INTEGER NOT NULL DEFAULT 0,
    created_ts REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS task_feedback (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    text    TEXT NOT NULL,
    source  TEXT,
    verdict TEXT NOT NULL,                  -- accepted | rejected
    ts      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Database:
    """Thread-safe SQLite wrapper (one shared connection + a lock)."""

    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(str(self.path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA synchronous=NORMAL")
        with self._lock:
            self._conn.executescript(SCHEMA)
            self._conn.commit()

    # -- low level -----------------------------------------------------
    def execute(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        with self._lock:
            cur = self._conn.execute(sql, tuple(params))
            self._conn.commit()
            return cur

    def query(self, sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._conn.execute(sql, tuple(params)).fetchall()

    def query_one(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Row | None:
        rows = self.query(sql, params)
        return rows[0] if rows else None

    # -- memories ------------------------------------------------------
    def add_memory(
        self,
        kind: str,
        text: str,
        *,
        source: str | None = None,
        title: str | None = None,
        meta: dict | None = None,
        embedding: bytes | None = None,
        ts: float | None = None,
    ) -> int:
        ts = ts if ts is not None else time.time()
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO memories (kind, source, title, text, meta, embedding, ts)"
                " VALUES (?,?,?,?,?,?,?)",
                (kind, source, title, text, json.dumps(meta or {}), embedding, ts),
            )
            rowid = cur.lastrowid
            self._conn.execute(
                "INSERT INTO memories_fts (rowid, text, title, source) VALUES (?,?,?,?)",
                (rowid, text, title or "", source or ""),
            )
            self._conn.commit()
            return int(rowid)

    def set_embedding(self, memory_id: int, embedding: bytes) -> None:
        self.execute("UPDATE memories SET embedding=? WHERE id=?", (embedding, memory_id))

    def memories_with_embeddings(self) -> list[sqlite3.Row]:
        return self.query(
            "SELECT id, kind, source, title, text, meta, embedding, ts FROM memories"
            " WHERE embedding IS NOT NULL"
        )

    def fts_search(self, query: str, limit: int = 30) -> list[sqlite3.Row]:
        # Escape FTS query into a phrase to avoid syntax errors on punctuation.
        safe = '"' + query.replace('"', '""') + '"'
        try:
            return self.query(
                "SELECT m.id, m.kind, m.source, m.title, m.text, m.meta, m.ts "
                "FROM memories_fts f JOIN memories m ON m.id = f.rowid "
                "WHERE memories_fts MATCH ? ORDER BY rank LIMIT ?",
                (safe, limit),
            )
        except sqlite3.OperationalError:
            return []

    def recent_memories(self, since_ts: float, kinds: tuple[str, ...] | None = None) -> list[sqlite3.Row]:
        if kinds:
            placeholders = ",".join("?" for _ in kinds)
            return self.query(
                f"SELECT * FROM memories WHERE ts>=? AND kind IN ({placeholders}) ORDER BY ts",
                (since_ts, *kinds),
            )
        return self.query("SELECT * FROM memories WHERE ts>=? ORDER BY ts", (since_ts,))

    def count_memories(self) -> int:
        row = self.query_one("SELECT COUNT(*) AS c FROM memories")
        return int(row["c"]) if row else 0

    def delete_memories_since(self, since_ts: float) -> int:
        ids = [r["id"] for r in self.query("SELECT id FROM memories WHERE ts>=?", (since_ts,))]
        with self._lock:
            self._conn.execute("DELETE FROM memories WHERE ts>=?", (since_ts,))
            for mid in ids:
                self._conn.execute("DELETE FROM memories_fts WHERE rowid=?", (mid,))
            self._conn.commit()
        return len(ids)

    def wipe(self) -> None:
        with self._lock:
            for t in ("memories", "memories_fts", "chats", "meetings", "routine_runs"):
                self._conn.execute(f"DELETE FROM {t}")
            self._conn.commit()

    # -- chat ----------------------------------------------------------
    def add_chat(self, role: str, content: str, sources: list[int] | None = None) -> int:
        return int(self.execute(
            "INSERT INTO chats (role, content, sources, ts) VALUES (?,?,?,?)",
            (role, content, json.dumps(sources or []), time.time()),
        ).lastrowid)

    def recent_chats(self, limit: int = 20) -> list[sqlite3.Row]:
        rows = self.query("SELECT * FROM chats ORDER BY id DESC LIMIT ?", (limit,))
        return list(reversed(rows))

    # -- meetings ------------------------------------------------------
    def add_meeting(self, transcript: str, *, title: str | None = None,
                    summary: str | None = None, audio_path: str | None = None,
                    duration_s: float | None = None) -> int:
        return int(self.execute(
            "INSERT INTO meetings (title, transcript, summary, audio_path, duration_s, ts)"
            " VALUES (?,?,?,?,?,?)",
            (title, transcript, summary, audio_path, duration_s, time.time()),
        ).lastrowid)

    def meetings(self, limit: int = 50) -> list[sqlite3.Row]:
        return self.query("SELECT * FROM meetings ORDER BY id DESC LIMIT ?", (limit,))

    def meeting(self, meeting_id: int) -> sqlite3.Row | None:
        return self.query_one("SELECT * FROM meetings WHERE id=?", (meeting_id,))

    # -- routines ------------------------------------------------------
    def add_routine(self, name: str, prompt: str, cadence: str, **kw) -> int:
        return int(self.execute(
            "INSERT INTO routines (name, prompt, cadence, hour, minute, weekday, day, enabled, created_ts)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (name, prompt, cadence, kw.get("hour", 8), kw.get("minute", 0),
             kw.get("weekday", 0), kw.get("day", 1), 1, time.time()),
        ).lastrowid)

    def routines(self, only_enabled: bool = False) -> list[sqlite3.Row]:
        sql = "SELECT * FROM routines"
        if only_enabled:
            sql += " WHERE enabled=1"
        return self.query(sql + " ORDER BY id")

    def routine(self, routine_id: int) -> sqlite3.Row | None:
        return self.query_one("SELECT * FROM routines WHERE id=?", (routine_id,))

    def update_routine(self, routine_id: int, **fields) -> None:
        if not fields:
            return
        cols = ", ".join(f"{k}=?" for k in fields)
        self.execute(f"UPDATE routines SET {cols} WHERE id=?", (*fields.values(), routine_id))

    def delete_routine(self, routine_id: int) -> None:
        self.execute("DELETE FROM routines WHERE id=?", (routine_id,))
        self.execute("DELETE FROM routine_runs WHERE routine_id=?", (routine_id,))

    def add_routine_run(self, routine_id: int, output: str) -> int:
        rid = int(self.execute(
            "INSERT INTO routine_runs (routine_id, output, ts) VALUES (?,?,?)",
            (routine_id, output, time.time()),
        ).lastrowid)
        self.update_routine(routine_id, last_run=time.time())
        return rid

    def routine_runs(self, routine_id: int, limit: int = 20) -> list[sqlite3.Row]:
        return self.query(
            "SELECT * FROM routine_runs WHERE routine_id=? ORDER BY id DESC LIMIT ?",
            (routine_id, limit),
        )

    # -- tasks -----------------------------------------------------------
    def add_task(self, text: str, *, owner: str | None = None,
                 due: str | None = None, source: str | None = None,
                 meeting_id: int | None = None) -> int:
        return int(self.execute(
            "INSERT INTO tasks (text, owner, due, source, meeting_id, done, created_ts)"
            " VALUES (?,?,?,?,?,0,?)",
            (text, owner, due, source, meeting_id, time.time()),
        ).lastrowid)

    def tasks(self, include_done: bool = False, limit: int = 200) -> list[sqlite3.Row]:
        sql = "SELECT * FROM tasks"
        if not include_done:
            sql += " WHERE done=0"
        return self.query(sql + " ORDER BY done, id DESC LIMIT ?", (limit,))

    def set_task_done(self, task_id: int, done: bool) -> None:
        # Completing an auto-suggested task is positive feedback: the
        # suggestion engine learns "more like this".
        if done:
            row = self.query_one("SELECT * FROM tasks WHERE id=?", (task_id,))
            if row and (row["source"] or "manual") != "manual" and not row["done"]:
                self.add_task_feedback(row["text"], row["source"], "accepted")
        self.execute("UPDATE tasks SET done=? WHERE id=?", (1 if done else 0, task_id))

    def delete_task(self, task_id: int) -> None:
        # Deleting an auto-suggested task WITHOUT completing it is negative
        # feedback: the engine learns to stop suggesting this kind of task.
        row = self.query_one("SELECT * FROM tasks WHERE id=?", (task_id,))
        if row and (row["source"] or "manual") != "manual" and not row["done"]:
            self.add_task_feedback(row["text"], row["source"], "rejected")
        self.execute("DELETE FROM tasks WHERE id=?", (task_id,))

    def add_task_feedback(self, text: str, source: str | None, verdict: str) -> int:
        return int(self.execute(
            "INSERT INTO task_feedback (text, source, verdict, ts) VALUES (?,?,?,?)",
            (text, source, verdict, time.time()),
        ).lastrowid)

    def task_feedback(self, verdict: str, limit: int = 40) -> list[sqlite3.Row]:
        return self.query(
            "SELECT * FROM task_feedback WHERE verdict=? ORDER BY id DESC LIMIT ?",
            (verdict, limit),
        )

    # -- kv ------------------------------------------------------------
    def kv_get(self, key: str, default: str | None = None) -> str | None:
        row = self.query_one("SELECT value FROM kv WHERE key=?", (key,))
        return row["value"] if row else default

    def kv_set(self, key: str, value: str) -> None:
        self.execute(
            "INSERT INTO kv (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?",
            (key, value, value),
        )
