"""Context-aware chat over your memory (RAG).

The assistant already "knows your work": every question is answered against
the most relevant remembered context (screen observations, meeting notes,
journals) retrieved from local semantic memory, with citations back to the
source memories.
"""

from __future__ import annotations

import time

from .db import Database
from .llm import llm
from .memory import Memory, Retrieved

SYSTEM_PROMPT = """You are LocalBird, a private on-device assistant that has been \
quietly observing the user's screen, meetings and notes. Answer the user's \
question using ONLY the remembered context below when it is relevant; if the \
context does not contain the answer, say what you do know and be honest about \
gaps. Be concise, specific and helpful. When you use a piece of context, you \
may refer to its source app/meeting naturally.

CONTEXT:
{context}
"""


def _format_context(hits: list[Retrieved]) -> str:
    lines = []
    for i, h in enumerate(hits, 1):
        when = time.strftime("%Y-%m-%d %H:%M", time.localtime(h.ts))
        label = h.title or h.source or h.kind
        lines.append(f"[{i}] ({h.kind} · {h.source or 'local'} · {when}) {label}\n{h.text}")
    return "\n\n".join(lines) if lines else "(no relevant memories found)"


class ChatEngine:
    def __init__(self, db: Database, memory: Memory):
        self.db = db
        self.memory = memory

    def ask(self, question: str, *, top_k: int | None = None) -> dict:
        hits = self.memory.search(question, top_k=top_k)
        context = _format_context(hits)
        history = self.db.recent_chats(limit=8)

        messages = [{"role": "system", "content": SYSTEM_PROMPT.format(context=context)}]
        for row in history:
            messages.append({"role": row["role"], "content": row["content"]})
        messages.append({"role": "user", "content": question})

        answer = llm.chat(messages)

        self.db.add_chat("user", question)
        self.db.add_chat("assistant", answer, sources=[h.id for h in hits])
        return {
            "answer": answer,
            "sources": [
                {"id": h.id, "kind": h.kind, "source": h.source,
                 "title": h.title, "ts": h.ts, "score": round(h.score, 3),
                 "excerpt": h.text[:280]}
                for h in hits
            ],
        }
