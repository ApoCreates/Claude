"""Local LLM + embedding provider.

Primary backend is `Ollama <https://ollama.com>`_ running on the same
machine, which gives you real local chat models and embedding models with
no API keys and no usage limits. If Ollama is not reachable, the provider
degrades to:

* a deterministic hashing embedder (so semantic-ish search still works), and
* an extractive responder that answers straight from retrieved context.

This keeps the whole app runnable — and testable — even before you have
models pulled, while still being genuinely powerful once Ollama is up.
"""

from __future__ import annotations

import hashlib
import math
import re
import struct
from typing import Iterable

import httpx

from .config import settings

_EMBED_DIM = 384  # dimension used by the offline fallback embedder


def _pack(vec: list[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)


def unpack(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


class LLM:
    def __init__(self) -> None:
        self._ollama_ok: bool | None = None

    # -- health --------------------------------------------------------
    def ollama_available(self, refresh: bool = False) -> bool:
        if self._ollama_ok is not None and not refresh:
            return self._ollama_ok
        try:
            r = httpx.get(f"{settings.ollama_url}/api/tags", timeout=2.5)
            self._ollama_ok = r.status_code == 200
        except Exception:
            self._ollama_ok = False
        return self._ollama_ok

    def status(self) -> dict:
        ok = self.ollama_available(refresh=True)
        models: list[str] = []
        if ok:
            try:
                r = httpx.get(f"{settings.ollama_url}/api/tags", timeout=3)
                models = [m["name"] for m in r.json().get("models", [])]
            except Exception:
                pass
        return {
            "ollama": ok,
            "models": models,
            "chat_model": settings.chat_model,
            "embed_model": settings.embed_model,
            "mode": "local-models" if ok else "offline-fallback",
        }

    # -- embeddings ----------------------------------------------------
    def embed(self, text: str) -> bytes:
        text = (text or "").strip()
        if self.ollama_available():
            try:
                r = httpx.post(
                    f"{settings.ollama_url}/api/embeddings",
                    json={"model": settings.embed_model, "prompt": text},
                    timeout=60,
                )
                if r.status_code == 200:
                    vec = r.json().get("embedding")
                    if vec:
                        return _pack([float(x) for x in vec])
            except Exception:
                pass
        if not settings.allow_offline_fallback:
            raise RuntimeError("Ollama unavailable and offline fallback disabled")
        return _pack(self._hash_embed(text))

    def _hash_embed(self, text: str) -> list[float]:
        """Deterministic bag-of-hashed-tokens embedding, L2-normalised.

        Not as good as a real embedding model, but stable and dependency-free
        so retrieval degrades gracefully rather than breaking.
        """
        vec = [0.0] * _EMBED_DIM
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        for tok in tokens:
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            vec[h % _EMBED_DIM] += 1.0
            vec[(h // _EMBED_DIM) % _EMBED_DIM] += 0.5
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    # -- chat ----------------------------------------------------------
    def chat(self, messages: list[dict], *, temperature: float = 0.4) -> str:
        """Chat completion. `messages` is a list of {role, content}."""
        if self.ollama_available():
            try:
                r = httpx.post(
                    f"{settings.ollama_url}/api/chat",
                    json={
                        "model": settings.chat_model,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": temperature},
                    },
                    timeout=180,
                )
                if r.status_code == 200:
                    return r.json().get("message", {}).get("content", "").strip()
            except Exception as exc:  # pragma: no cover - network
                return self._fallback_answer(messages, error=str(exc))
        return self._fallback_answer(messages)

    def complete(self, prompt: str, *, temperature: float = 0.4) -> str:
        return self.chat([{"role": "user", "content": prompt}], temperature=temperature)

    def _fallback_answer(self, messages: list[dict], error: str | None = None) -> str:
        """Extractive answer used when no chat model is available.

        It returns the retrieved context (already stuffed into the system
        message by the caller) plus the question, so the user still gets
        something useful rather than an error.
        """
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        question = next((m["content"] for m in reversed(messages)
                         if m["role"] == "user"), "")
        context = ""
        if "CONTEXT:" in system:
            context = system.split("CONTEXT:", 1)[1].strip()
        note = (
            "_LocalBird is running in offline-fallback mode (no chat model found). "
            "Install Ollama and pull a model — e.g. `ollama pull llama3.1` — for full "
            "conversational answers. Meanwhile, here is the most relevant remembered "
            "context for your question._"
        )
        snippets = context[:2000] if context else "(no matching memories yet)"
        body = f"{note}\n\n**Question:** {question}\n\n**Relevant memory:**\n{snippets}"
        if error:
            body += f"\n\n<!-- backend error: {error} -->"
        return body


def cosine(a: Iterable[float], b: Iterable[float]) -> float:
    a = list(a)
    b = list(b)
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


llm = LLM()
