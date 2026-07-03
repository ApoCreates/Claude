"""Semantic memory: ingestion, embedding and hybrid retrieval.

Text captured from the screen, meetings and notes is chunked, embedded and
stored. Retrieval combines dense (cosine over embeddings) and sparse
(SQLite FTS keyword) signals so it works whether or not a real embedding
model is available.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass

from .db import Database
from .llm import cosine, llm, unpack
from .config import settings


@dataclass
class Retrieved:
    id: int
    kind: str
    source: str
    title: str
    text: str
    ts: float
    score: float


def _chunk(text: str, size: int) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text.strip())
    if len(text) <= size:
        return [text] if text else []
    chunks, buf = [], []
    length = 0
    for para in text.split("\n"):
        if length + len(para) > size and buf:
            chunks.append("\n".join(buf).strip())
            buf, length = [], 0
        buf.append(para)
        length += len(para) + 1
    if buf:
        chunks.append("\n".join(buf).strip())
    return [c for c in chunks if c]


class Memory:
    def __init__(self, db: Database):
        self.db = db

    def remember(
        self,
        text: str,
        *,
        kind: str = "note",
        source: str | None = None,
        title: str | None = None,
        meta: dict | None = None,
        ts: float | None = None,
    ) -> list[int]:
        """Chunk, embed and store text. Returns the created memory ids."""
        ids: list[int] = []
        for chunk in _chunk(text, settings.chunk_chars):
            emb = llm.embed(f"{title or ''}\n{chunk}")
            mid = self.db.add_memory(
                kind, chunk, source=source, title=title, meta=meta,
                embedding=emb, ts=ts,
            )
            ids.append(mid)
        return ids

    def search(self, query: str, top_k: int | None = None) -> list[Retrieved]:
        top_k = top_k or settings.retrieval_top_k
        query = (query or "").strip()
        if not query:
            return []

        # Dense retrieval over stored embeddings.
        q_emb = unpack(llm.embed(query))
        dense: dict[int, Retrieved] = {}
        for row in self.db.memories_with_embeddings():
            score = cosine(q_emb, unpack(row["embedding"]))
            dense[row["id"]] = Retrieved(
                id=row["id"], kind=row["kind"], source=row["source"] or "",
                title=row["title"] or "", text=row["text"], ts=row["ts"], score=score,
            )

        # Sparse keyword retrieval boosts exact-term matches.
        sparse_ids = {r["id"] for r in self.db.fts_search(query, limit=top_k * 3)}

        results = list(dense.values())
        for r in results:
            if r.id in sparse_ids:
                r.score += 0.15  # keyword bonus
        # Slight recency tilt so newer context wins ties.
        now = time.time()
        for r in results:
            age_days = max(0.0, (now - r.ts) / 86400)
            r.score += max(0.0, 0.05 - age_days * 0.001)

        results.sort(key=lambda r: r.score, reverse=True)
        # Ensure any pure-keyword hits with no embedding still surface.
        have = {r.id for r in results[:top_k]}
        for row in self.db.fts_search(query, limit=top_k):
            if row["id"] not in have and len([x for x in results if x.score > 0]) < top_k:
                results.append(Retrieved(
                    id=row["id"], kind=row["kind"], source=row["source"] or "",
                    title=row["title"] or "", text=row["text"], ts=row["ts"], score=0.1,
                ))
        return [r for r in results[:top_k] if r.score > 0]

    def stats(self) -> dict:
        rows = self.db.query("SELECT kind, COUNT(*) AS c FROM memories GROUP BY kind")
        by_kind = {r["kind"]: r["c"] for r in rows}
        first = self.db.query_one("SELECT MIN(ts) AS t FROM memories")
        return {
            "total": self.db.count_memories(),
            "by_kind": by_kind,
            "since": first["t"] if first and first["t"] else None,
        }
