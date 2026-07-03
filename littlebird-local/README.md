# 🐦 LocalBird

A **fully-local, unlimited** desktop context assistant for your Mac — an open,
self-hosted take on the "reads your screen, remembers everything, and lets you
chat over your work" idea.

Everything runs on your own machine: screen-text capture, semantic memory,
meeting transcription, chat, daily journals and scheduled routines. **No cloud,
no accounts, no API keys, no usage limits.** Because it's yours, every feature
that's normally behind a paywall (unlimited meeting notes, image generation,
bigger context, best models) is simply on by default.

> **Honest scope.** This is a real, working app you run locally — not a clone of
> anyone's proprietary product or code. The native screen-text capture and mic
> capture are macOS-specific and need Accessibility/Screen-Recording/Microphone
> permission plus the optional dependencies. The chat/memory/journal/routine
> engine runs anywhere and works even before you install a local model (it
> degrades to an offline fallback so you're never blocked).

## What it does

| Feature | How it works locally |
|---|---|
| **Screen memory** | Reads the *text* of your active window (macOS Accessibility tree — no screenshots/video), de-duplicates, embeds and stores it. |
| **Ask your work (chat)** | RAG over your semantic memory with citations back to the source app/meeting/email. |
| **Meeting auto-detection** | Detects Zoom/Teams/Meet/FaceTime/Webex calls starting, sends a native notification and asks whether to record (`ask`/`always`/`never`). Stops + summarises automatically when the call ends. |
| **Meeting notes** | On-device faster-whisper transcription, then a structured summary: TL;DR, key points, decisions, action items, follow-ups, and an exact "people & numbers" section. Unlimited. |
| **Tasks** | Action items from meetings land in a task list automatically (owner + due date parsed); add/check/delete your own. Chat knows your open tasks. |
| **Mail & Calendar connectors** | Reads Apple Mail inbox + Calendar events locally via AppleScript — any account added to the macOS Mail/Calendar apps (Gmail, iCloud, Exchange…) is included, and nothing is sent to any cloud. |
| **Daily journal** | Auto-summarises your day into a written entry; also generated nightly. |
| **Routines** | Saved prompts that run daily/weekly/monthly (e.g. "daily briefing"). |
| **Image generation** | Local Stable Diffusion (Automatic1111/SD.Next) via `LOCALBIRD_SD_URL`. Unlimited. |
| **Privacy** | Excludes password managers, redacts passwords/cards/keys/private-keys, skips sign-in/checkout/incognito windows. Pause or delete anytime. |
| **Runs at login** | `./install_autostart.sh` installs a LaunchAgent so LocalBird is always on in the background (`remove` to uninstall). |

### Permissions cheat-sheet (macOS)

| Feature | Permission prompt | Where |
|---|---|---|
| Screen memory | Accessibility | Privacy & Security → Accessibility → Terminal |
| Meeting recording | Microphone | Privacy & Security → Microphone → Terminal |
| Mail / Calendar connectors | Automation ("Terminal wants to control Mail") | Click **Allow** on first sync |

> If you use `install_autostart.sh`, permissions belong to `.venv/bin/python`
> instead of Terminal — the script prints the exact path to add.

## Quick start

### Mac (full experience)
```bash
cd littlebird-local
./setup_mac.sh        # installs Ollama, pulls models, installs deps
./run.sh              # → http://127.0.0.1:8848
```
Then grant **Accessibility** (and optionally **Screen Recording** + **Microphone**)
to your terminal in *System Settings → Privacy & Security*.

Optional menu-bar control:
```bash
python -m menubar.app
```

### Anywhere (core, no native capture)
```bash
cd littlebird-local
./run.sh              # creates a venv, installs core deps, starts the server
```
Open http://127.0.0.1:8848. Chat/memory/journal/routines all work. Install a
local model for full answers:
```bash
# https://ollama.com
ollama pull llama3.1 && ollama pull nomic-embed-text
```

## Local models

LocalBird uses **[Ollama](https://ollama.com)** for chat + embeddings.
- Chat model: `LOCALBIRD_CHAT_MODEL` (default `llama3.1`; try `llama3.2:3b` on lighter Macs)
- Embeddings: `LOCALBIRD_EMBED_MODEL` (default `nomic-embed-text`)

If Ollama isn't running, LocalBird stays functional via an offline fallback
(deterministic hashing embeddings + extractive answers) so the UI, capture,
search and scheduling all still work.

## Configuration

Copy `.env.example` → `.env` (or `~/.localbird/.env`). Highlights:

- `LOCALBIRD_CAPTURE_INTERVAL` — seconds between window reads (default 6)
- `LOCALBIRD_EXCLUDED_APPS` — comma-separated apps to never capture
- `LOCALBIRD_WHISPER_MODEL` — `tiny.en` … `large-v3`
- `LOCALBIRD_SD_URL` — your local Stable Diffusion endpoint for images

All data lives in `~/.localbird/` (SQLite DB + audio + images). Delete that
folder to wipe everything, or use **Settings → Delete all memory** in the UI.

## Architecture

```
localbird/
  config.py         settings + paths
  db.py             SQLite store (memories, chats, meetings, routines) + FTS
  llm.py            Ollama chat/embeddings + offline fallback
  memory.py         chunk → embed → hybrid (dense + keyword) retrieval
  capture/          active-window text capture (macOS AX) + privacy filter
  transcription.py  faster-whisper meetings + mic recorder + summariser
  chat.py           RAG chat with citations
  journals.py       daily journal generation
  routines.py       scheduled saved prompts
  scheduler.py      dependency-free daily/weekly/monthly runner
  server.py         FastAPI API + serves the web dashboard
ui/                 single-page dashboard (chat/timeline/meetings/journal/…)
menubar/            optional macOS menu-bar app (rumps)
tests/              offline test suite
```

## Tests
```bash
pip install pytest
pytest -q            # runs fully offline
```

## Privacy & security

- **Local only.** The server binds to `127.0.0.1`. Nothing leaves your machine.
- Sensitive apps excluded; passwords/cards/keys redacted before storage.
- Pause capture, "forget last hour", or wipe all data at any time.

## Limitations (read these)

- Native screen-text and mic capture require **macOS + permissions + optional deps**.
  Off a Mac, capture falls back to window titles so the rest is still usable.
- Answer quality tracks the local model you run; small models are lighter but weaker.
- Image generation needs a separate local Stable Diffusion server.

MIT-licensed. Built to be read, forked and modified.
