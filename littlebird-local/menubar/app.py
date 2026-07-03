"""macOS menu bar companion (optional).

A tiny always-there control for LocalBird: shows capture state and gives you
pause/resume, a quick "open dashboard", and one-tap journal generation. Runs
alongside the server (which it starts if needed). Requires `rumps`
(`pip install rumps`) and only works on macOS.

Run with:  python -m menubar.app
"""

from __future__ import annotations

import threading
import webbrowser

import httpx

try:
    import rumps
except Exception as exc:  # pragma: no cover - mac-only optional dep
    raise SystemExit("rumps is required for the menu bar app: pip install rumps") from exc

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from localbird.config import settings  # noqa: E402


BASE = f"http://{settings.host}:{settings.port}"


def _server_up() -> bool:
    try:
        return httpx.get(f"{BASE}/api/health", timeout=1).status_code == 200
    except Exception:
        return False


def _start_server_thread() -> None:
    from localbird.server import main
    threading.Thread(target=main, daemon=True).start()


class LocalBirdBar(rumps.App):
    def __init__(self) -> None:
        super().__init__("🐦", quit_button="Quit LocalBird")
        self.menu = ["Open dashboard", "Pause capture", "Resume capture",
                     None, "Generate journal", None, "Status"]
        if not _server_up():
            _start_server_thread()
        rumps.Timer(self._refresh, 20).start()

    def _refresh(self, _=None):
        try:
            s = httpx.get(f"{BASE}/api/status", timeout=2).json()
            paused = s["capture"]["paused"]
            self.title = "🐦" if not paused else "🐦⏸"
        except Exception:
            self.title = "🐦…"

    @rumps.clicked("Open dashboard")
    def open_dash(self, _):
        webbrowser.open(BASE)

    @rumps.clicked("Pause capture")
    def pause(self, _):
        httpx.post(f"{BASE}/api/capture/pause", timeout=3)
        self._refresh()

    @rumps.clicked("Resume capture")
    def resume(self, _):
        httpx.post(f"{BASE}/api/capture/resume", timeout=3)
        self._refresh()

    @rumps.clicked("Generate journal")
    def journal(self, _):
        httpx.post(f"{BASE}/api/journal/today", timeout=120)
        rumps.notification("LocalBird", "Journal", "Today's journal generated.")

    @rumps.clicked("Status")
    def status(self, _):
        try:
            s = httpx.get(f"{BASE}/api/status", timeout=2).json()
            rumps.alert("LocalBird status",
                        f"Mode: {s['llm']['mode']}\nMemories: {s['memory']['total']}\n"
                        f"Capture: {s['capture']['mode']}")
        except Exception:
            rumps.alert("LocalBird", "Server not reachable.")


if __name__ == "__main__":
    LocalBirdBar().run()
