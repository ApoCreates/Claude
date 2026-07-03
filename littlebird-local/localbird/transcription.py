"""Local meeting transcription + summarisation.

Audio is transcribed entirely on-device with faster-whisper (CTranslate2).
Both an uploaded audio file and a live-recorded meeting are supported. The
transcript is summarised by the local chat model and stored as memory.
"""

from __future__ import annotations

import threading
import time
import wave
from pathlib import Path

from .config import settings
from .db import Database
from .llm import llm
from .memory import Memory

SUMMARY_PROMPT = """Summarise the following meeting transcript. Produce:
- **TL;DR**: 2-3 sentences.
- **Key points**: bullet list.
- **Decisions**: bullet list (or "none").
- **Action items**: bullet list with owner if stated (or "none").

TRANSCRIPT:
{transcript}
"""


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

    def transcribe_file(self, path: str | Path) -> dict:
        model = self._ensure()
        if model is None:
            return {"ok": False, "error": self._load_error or
                    "faster-whisper not installed (pip install faster-whisper)",
                    "text": ""}
        segments, info = model.transcribe(str(path), vad_filter=True)
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
        with self._lock:
            result = self.transcriber.transcribe_file(path)
        if not result["ok"] or not result["text"].strip():
            return {"ok": False, "error": result.get("error", "empty transcript")}
        return self._store(result["text"], title=title,
                           audio_path=str(path), duration=result.get("duration"))

    def ingest_text(self, transcript: str, title: str | None = None) -> dict:
        """Store a transcript you already have (e.g. pasted) + summarise."""
        return self._store(transcript, title=title)

    def _store(self, transcript: str, *, title: str | None,
               audio_path: str | None = None, duration: float | None = None) -> dict:
        summary = llm.complete(SUMMARY_PROMPT.format(transcript=transcript[:12000]),
                               temperature=0.3)
        title = title or f"Meeting {time.strftime('%Y-%m-%d %H:%M')}"
        meeting_id = self.db.add_meeting(transcript, title=title, summary=summary,
                                         audio_path=audio_path, duration_s=duration)
        self.memory.remember(f"{summary}\n\n---\nFull transcript:\n{transcript}",
                            kind="meeting", source="meeting", title=title)
        return {"ok": True, "meeting_id": meeting_id, "title": title,
                "summary": summary, "transcript": transcript}

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
