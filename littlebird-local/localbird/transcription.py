"""Local meeting transcription + summarisation.

Audio is transcribed entirely on-device with faster-whisper (CTranslate2).
Both an uploaded audio file and a live-recorded meeting are supported. The
transcript is summarised by the local chat model and stored as memory.
"""

from __future__ import annotations

import json
import re
import threading
import time
import wave
from pathlib import Path

from .config import settings
from .db import Database
from .llm import llm
from .memory import Memory

SUMMARY_PROMPT = """You are an expert meeting-notes writer producing recap notes
in the style of the best meeting assistants. {user_line}{glossary_line}
Using ONLY the meeting material below, write notes in EXACTLY this markdown
structure:

## Quick recap
One tight narrative paragraph: what kind of meeting this was, who joined or
was introduced (with roles), what it covered, and the headline outcomes —
timelines, agreements, who coordinates what.

## Next steps
Group the work BY PERSON. One section per person who took on work, using
their exact name, with their commitments as bullets (include the deadline
whenever one was stated):
### NAME
- Commitment, specific and self-contained, with due date if stated.

If two people agreed to do something together, add a final section:
### Collaboration
- NAME and NAME: the joint item.

If a task's owner is genuinely unclear, put it under "### Unassigned".

## Summary
Break the meeting into 3-7 chapters in chronological order. Each chapter:
### Short descriptive title (e.g. "Project Timeline and Deliverables Planning")
One paragraph of substance: who said or agreed what, with exact numbers,
dates and durations quoted (e.g. "12 weeks from when the music is received",
"by end of next week").

Rules:
- Attribute a next step ONLY to the person who accepted or was clearly given
  that work in the material. Do not guess owners.
- Use the EXACT name spellings from the material{glossary_rule}. Never
  anglicise, shorten or "correct" a name on your own.
- Never invent facts, owners or dates that are not in the material.

MEETING MATERIAL:
{material}
"""

CHUNK_NOTES_PROMPT = """These are detailed running notes for one part of a longer
meeting. From the transcript section below, extract with exact wording:
speakers/names, commitments (who will do what by when), agreements and
decisions, numbers/dates/amounts, and open questions. Dense bullets only.

SECTION {idx}/{total}:
{chunk}
"""

TASKS_PROMPT = """From the "Next steps" of this meeting summary, extract every \
action item as a JSON array. Each element: \
{{"task": "...", "owner": "name or null", "due": "date or null"}}.
Return ONLY the JSON array, nothing else. If there are none, return [].

SUMMARY:
{summary}
"""


def parse_next_steps(summary: str) -> list[dict]:
    """Deterministic parser for the '## Next steps' per-person sections.

    Used as the extraction fallback (and safety net) so tasks always land in
    the task list even without a chat model.
    """
    m = re.search(r"##\s*Next steps(.*?)(?=\n##\s|\Z)", summary, re.S | re.I)
    items: list[dict] = []
    if m:
        owner: str | None = None
        for line in m.group(1).splitlines():
            h = re.match(r"###\s*(.+)", line)
            if h:
                owner = h.group(1).strip()
                continue
            b = re.match(r"\s*[-*]\s*(?:\[\s?\]\s*)?(.+)", line)
            if b and b.group(1).strip():
                o = owner
                if o and o.lower() in ("unassigned", "collaboration", "none"):
                    o = None
                items.append({"task": b.group(1).strip(), "owner": o, "due": None})
    # Also accept legacy "- [ ] task — owner: X — due: Y" checkbox lines.
    for line in summary.splitlines():
        cm = re.match(r"\s*-\s*\[\s?\]\s*(.+)", line)
        if not cm:
            continue
        text = cm.group(1).strip()
        owner = due = None
        om = re.search(r"—\s*owner:\s*([^—]+)", text)
        dm = re.search(r"—\s*due:\s*(.+)$", text)
        if om:
            owner = om.group(1).strip()
            owner = None if owner.lower() in ("unassigned", "none") else owner
        if dm:
            due = dm.group(1).strip()
            due = None if due.lower() == "none" else due
        text = re.split(r"—\s*owner:", text)[0].strip()
        if text and not any(t["task"] == text for t in items):
            items.append({"task": text, "owner": owner, "due": due})
    return items


class Transcriber:
    """Wraps faster-whisper, loaded lazily so importing this module is cheap
    and the app still runs when whisper isn't installed."""

    def __init__(self) -> None:
        self._model = None
        self._load_error: str | None = None

    def available(self) -> bool:
        return self._ensure() is not None

    def _ensure(self):
        if self._model is not None:
            return self._model
        if self._load_error is not None:
            return None
        try:
            from faster_whisper import WhisperModel  # type: ignore
            device = settings.whisper_device
            compute = "int8" if device in ("cpu", "auto") else "float16"
            self._model = WhisperModel(settings.whisper_model, device=device,
                                       compute_type=compute)
            return self._model
        except Exception as exc:  # pragma: no cover - optional dep
            self._load_error = str(exc)
            return None

    def transcribe_file(self, path: str | Path, initial_prompt: str | None = None) -> dict:
        model = self._ensure()
        if model is None:
            return {"ok": False, "error": self._load_error or
                    "faster-whisper not installed (pip install faster-whisper)",
                    "text": ""}
        # initial_prompt biases Whisper toward known vocabulary (names,
        # company terms) so "Lefki" doesn't come out as "Lefty".
        segments, info = model.transcribe(str(path), vad_filter=True,
                                          initial_prompt=initial_prompt or None)
        parts = [seg.text.strip() for seg in segments]
        return {
            "ok": True,
            "text": " ".join(p for p in parts if p),
            "language": getattr(info, "language", None),
            "duration": getattr(info, "duration", None),
        }


class MeetingRecorder:
    """Records microphone (and, if a virtual device is configured, system)
    audio to a WAV file for later transcription. Uses sounddevice if present.
    """

    def __init__(self) -> None:
        self._sd = None
        self._frames: list = []
        self._stream = None
        self._start_ts = 0.0
        self.recording = False
        self._samplerate = 16000
        try:
            import sounddevice as sd  # type: ignore
            self._sd = sd
        except Exception:
            self._sd = None

    def available(self) -> bool:
        return self._sd is not None

    def start(self, device: int | None = None) -> None:
        if not self.available() or self.recording:
            return
        self._frames = []
        self._start_ts = time.time()

        def _cb(indata, frames, time_info, status):  # noqa: ANN001
            self._frames.append(indata.copy())

        self._stream = self._sd.InputStream(
            samplerate=self._samplerate, channels=1, callback=_cb, device=device,
        )
        self._stream.start()
        self.recording = True

    def stop(self) -> Path | None:
        if not self.recording:
            return None
        self.recording = False
        try:
            self._stream.stop()
            self._stream.close()
        except Exception:
            pass
        if not self._frames:
            return None
        import numpy as np  # sounddevice pulls numpy in
        data = np.concatenate(self._frames, axis=0)
        pcm = (data * 32767).astype("<i2").tobytes()
        out = settings.audio_dir / f"meeting-{int(self._start_ts)}.wav"
        with wave.open(str(out), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self._samplerate)
            wf.writeframes(pcm)
        return out


class MeetingService:
    def __init__(self, db: Database, memory: Memory):
        self.db = db
        self.memory = memory
        self.transcriber = Transcriber()
        self.recorder = MeetingRecorder()
        self._lock = threading.Lock()

    def status(self) -> dict:
        return {
            "whisper_available": self.transcriber.available(),
            "recorder_available": self.recorder.available(),
            "recording": self.recorder.recording,
            "whisper_model": settings.whisper_model,
        }

    def ingest_audio(self, path: str | Path, title: str | None = None) -> dict:
        glossary = self.db.kv_get("profile_glossary", "") or ""
        with self._lock:
            result = self.transcriber.transcribe_file(
                path, initial_prompt=glossary[:600] or None)
        if not result["ok"] or not result["text"].strip():
            return {"ok": False, "error": result.get("error", "empty transcript")}
        return self._store(result["text"], title=title,
                           audio_path=str(path), duration=result.get("duration"))

    def ingest_text(self, transcript: str, title: str | None = None) -> dict:
        """Store a transcript you already have (e.g. pasted) + summarise."""
        return self._store(transcript, title=title)

    def _summarise(self, transcript: str) -> str:
        """Structured, name-faithful summary with map-reduce for long calls.

        Long transcripts used to be truncated, which silently dropped the end
        of the meeting — exactly where decisions and action items live. Now
        long calls are condensed chunk-by-chunk first, then composed.
        """
        if not llm.ollama_available():
            # Without a model, return an honest stub instead of the generic
            # extractive fallback — that fallback echoes the prompt template,
            # which the Next-steps parser would misread as real tasks.
            return ("_No local model found — install Ollama and pull one "
                    "(e.g. `ollama pull llama3.1`), then click ↻ Re-summarise "
                    "to generate full notes._\n\n### Transcript excerpt\n"
                    + transcript[:1500])

        user_name = (self.db.kv_get("profile_name", "") or "").strip()
        glossary = (self.db.kv_get("profile_glossary", "") or "").strip()
        user_line = (f"The user these notes are for is: {user_name}. "
                     f"Write the 'For You' section about them.\n") if user_name else ""
        glossary_line = (f"Known people & terms (authoritative spellings): "
                         f"{glossary}\n") if glossary else ""
        glossary_rule = (", and when the transcript contains a near-miss of a "
                         "known name, use the known spelling") if glossary else ""

        material = transcript
        if len(transcript) > 9000 and llm.ollama_available():
            chunks = [transcript[i:i + 8000]
                      for i in range(0, len(transcript), 8000)]
            notes = []
            for i, chunk in enumerate(chunks, 1):
                notes.append(llm.complete(
                    CHUNK_NOTES_PROMPT.format(idx=i, total=len(chunks), chunk=chunk),
                    temperature=0.2))
            material = "\n\n".join(notes)

        return llm.complete(
            SUMMARY_PROMPT.format(user_line=user_line, glossary_line=glossary_line,
                                  glossary_rule=glossary_rule,
                                  material=material[:16000]),
            temperature=0.25)

    def resummarise(self, meeting_id: int) -> dict:
        """Re-run summarisation on a stored meeting (e.g. after upgrading the
        model or prompt) without re-transcribing."""
        row = self.db.meeting(meeting_id)
        if not row:
            return {"ok": False, "error": "meeting not found"}
        summary = self._summarise(row["transcript"])
        self.db.execute("UPDATE meetings SET summary=? WHERE id=?",
                        (summary, meeting_id))
        return {"ok": True, "meeting_id": meeting_id, "summary": summary}

    def _store(self, transcript: str, *, title: str | None,
               audio_path: str | None = None, duration: float | None = None) -> dict:
        summary = self._summarise(transcript)
        title = title or f"Meeting {time.strftime('%Y-%m-%d %H:%M')}"
        meeting_id = self.db.add_meeting(transcript, title=title, summary=summary,
                                         audio_path=audio_path, duration_s=duration)
        self.memory.remember(f"{summary}\n\n---\nFull transcript:\n{transcript}",
                            kind="meeting", source="meeting", title=title)
        tasks = self._extract_tasks(summary, title, meeting_id)
        return {"ok": True, "meeting_id": meeting_id, "title": title,
                "summary": summary, "transcript": transcript, "tasks": tasks}

    def _extract_tasks(self, summary: str, title: str, meeting_id: int) -> list[dict]:
        """Turn the summary's action items into task records.

        Primary path asks the LLM for JSON; fallback parses the summary's
        `- [ ]` checkbox lines directly so tasks still appear offline.
        """
        items: list[dict] = []
        raw = llm.complete(TASKS_PROMPT.format(summary=summary[:6000]),
                           temperature=0.1) if llm.ollama_available() else ""
        m = re.search(r"\[.*\]", raw, re.S)
        if m:
            try:
                for it in json.loads(m.group(0)):
                    task = (it.get("task") or "").strip()
                    if task:
                        items.append({"task": task, "owner": it.get("owner"),
                                      "due": it.get("due")})
            except Exception:
                items = []
        if not items:
            items = parse_next_steps(summary)

        created = []
        for it in items[:20]:
            tid = self.db.add_task(it["task"], owner=it.get("owner"),
                                   due=it.get("due"), source=title,
                                   meeting_id=meeting_id)
            created.append({"id": tid, **it})
        return created

    def start_recording(self) -> dict:
        if not self.recorder.available():
            return {"ok": False, "error": "sounddevice not installed "
                    "(pip install sounddevice numpy)"}
        self.recorder.start()
        return {"ok": True, "recording": True}

    def stop_recording(self, title: str | None = None) -> dict:
        path = self.recorder.stop()
        if path is None:
            return {"ok": False, "error": "no audio captured"}
        return self.ingest_audio(path, title=title)
