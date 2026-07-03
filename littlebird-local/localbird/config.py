"""Configuration and paths.

All settings come from environment variables (optionally loaded from a
``.env`` file) with sensible local-first defaults. Because everything runs
locally there are no usage limits anywhere in the app — the "unlimited"
promise is simply the absence of counters.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _load_dotenv(path: Path) -> None:
    """Minimal .env loader (no dependency on python-dotenv)."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


def _bool(name: str, default: bool) -> bool:
    v = os.environ.get(name)
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


DATA_DIR = Path(os.environ.get("LOCALBIRD_HOME", Path.home() / ".localbird")).expanduser()
_load_dotenv(DATA_DIR / ".env")
_load_dotenv(Path.cwd() / ".env")


@dataclass
class Settings:
    # --- storage -------------------------------------------------------
    data_dir: Path = DATA_DIR
    db_path: Path = field(default_factory=lambda: DATA_DIR / "localbird.db")
    audio_dir: Path = field(default_factory=lambda: DATA_DIR / "audio")
    image_dir: Path = field(default_factory=lambda: DATA_DIR / "images")

    # --- server --------------------------------------------------------
    host: str = os.environ.get("LOCALBIRD_HOST", "127.0.0.1")
    port: int = _int("LOCALBIRD_PORT", 8848)

    # --- local models (Ollama) ----------------------------------------
    ollama_url: str = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
    chat_model: str = os.environ.get("LOCALBIRD_CHAT_MODEL", "llama3.1")
    embed_model: str = os.environ.get("LOCALBIRD_EMBED_MODEL", "nomic-embed-text")
    # If Ollama isn't reachable, the app degrades gracefully to an offline
    # hashing embedder + an extractive responder so it still runs.
    allow_offline_fallback: bool = _bool("LOCALBIRD_OFFLINE_FALLBACK", True)

    # --- capture -------------------------------------------------------
    capture_enabled: bool = _bool("LOCALBIRD_CAPTURE_ENABLED", True)
    capture_interval_s: float = float(os.environ.get("LOCALBIRD_CAPTURE_INTERVAL", "6"))
    # Minimum characters of window text worth remembering.
    capture_min_chars: int = _int("LOCALBIRD_CAPTURE_MIN_CHARS", 40)
    # Apps / window-title substrings to never capture (privacy).
    excluded_apps: tuple[str, ...] = tuple(
        a.strip() for a in os.environ.get(
            "LOCALBIRD_EXCLUDED_APPS",
            "1Password,Keychain Access,Bitwarden,LastPass,Dashlane",
        ).split(",") if a.strip()
    )

    # --- transcription -------------------------------------------------
    whisper_model: str = os.environ.get("LOCALBIRD_WHISPER_MODEL", "base.en")
    whisper_device: str = os.environ.get("LOCALBIRD_WHISPER_DEVICE", "auto")

    # --- meeting auto-detection ---------------------------------------
    meeting_watch_enabled: bool = _bool("LOCALBIRD_MEETING_WATCH", True)
    # ask  -> notify + dialog asking whether to record
    # always -> start recording silently
    # never  -> just notify, never record automatically
    meeting_autorecord: str = os.environ.get("LOCALBIRD_MEETING_AUTORECORD", "ask")
    meeting_max_minutes: int = _int("LOCALBIRD_MEETING_MAX_MINUTES", 150)

    # --- screen -> tasks insights sweep ---------------------------------
    insights_enabled: bool = _bool("LOCALBIRD_INSIGHTS", True)
    insights_interval_min: int = _int("LOCALBIRD_INSIGHTS_INTERVAL_MIN", 45)

    # --- local connectors (Apple Mail / Calendar via AppleScript) ------
    connectors: tuple[str, ...] = tuple(
        c.strip() for c in os.environ.get(
            "LOCALBIRD_CONNECTORS", "mail,calendar").split(",") if c.strip()
    )
    connector_interval_min: int = _int("LOCALBIRD_CONNECTOR_INTERVAL_MIN", 15)
    mail_max_messages: int = _int("LOCALBIRD_MAIL_MAX_MESSAGES", 15)

    # --- image generation ---------------------------------------------
    # A local Stable-Diffusion-compatible endpoint (Automatic1111 / ComfyUI /
    # SD.Next). Left blank -> image feature reports "not configured".
    sd_url: str = os.environ.get("LOCALBIRD_SD_URL", "")

    # --- retrieval -----------------------------------------------------
    retrieval_top_k: int = _int("LOCALBIRD_TOP_K", 12)
    chunk_chars: int = _int("LOCALBIRD_CHUNK_CHARS", 1200)

    def ensure_dirs(self) -> None:
        for p in (self.data_dir, self.audio_dir, self.image_dir):
            p.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
