"""Platform-specific window inspectors.

Each source returns a ``WindowSnapshot`` describing the frontmost window:
its owning app, title and (where possible) the readable text inside it.

macOS is the primary target and reads the Accessibility tree. Other
platforms fall back to whatever window metadata is available so the app can
still be run and demonstrated off a Mac.
"""

from __future__ import annotations

import platform
import subprocess
from dataclasses import dataclass


@dataclass
class WindowSnapshot:
    app: str
    title: str
    text: str


def _mac_frontmost_app() -> str:
    try:
        out = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get name of first application process whose frontmost is true'],
            capture_output=True, text=True, timeout=3,
        )
        return out.stdout.strip()
    except Exception:
        return ""


class MacOSSource:
    """Reads the frontmost window's accessibility text on macOS.

    Uses pyobjc (ApplicationServices / AppKit). Requires the host app to
    have Accessibility permission granted in System Settings > Privacy.
    """

    def __init__(self) -> None:
        self._ax = None
        try:  # imported lazily; only present on a configured Mac
            from ApplicationServices import (  # type: ignore
                AXUIElementCreateApplication,
                AXUIElementCopyAttributeValue,
            )
            from AppKit import NSWorkspace  # type: ignore
            self._AXUIElementCreateApplication = AXUIElementCreateApplication
            self._AXUIElementCopyAttributeValue = AXUIElementCopyAttributeValue
            self._NSWorkspace = NSWorkspace
            self._ax = True
        except Exception:
            self._ax = None

    @property
    def available(self) -> bool:
        return self._ax is not None

    def _copy(self, element, attr):
        err, val = self._AXUIElementCopyAttributeValue(element, attr, None)
        return val if err == 0 else None

    def _collect_text(self, element, depth: int = 0, budget: list[int] | None = None) -> list[str]:
        if budget is None:
            budget = [4000]  # cap traversal so we never hang on huge trees
        if depth > 45 or budget[0] <= 0:
            return []
        out: list[str] = []
        for attr in ("AXValue", "AXTitle", "AXDescription"):
            val = self._copy(element, attr)
            if isinstance(val, str) and val.strip():
                out.append(val.strip())
                budget[0] -= 1
        children = self._copy(element, "AXChildren") or []
        for child in children:
            if budget[0] <= 0:
                break
            out.extend(self._collect_text(child, depth + 1, budget))
        return out

    def snapshot(self) -> WindowSnapshot | None:
        if not self.available:
            return None
        try:
            ws = self._NSWorkspace.sharedWorkspace()
            app = ws.frontmostApplication()
            if app is None:
                return None
            pid = app.processIdentifier()
            name = str(app.localizedName() or "")
            ax_app = self._AXUIElementCreateApplication(pid)
            focused = self._copy(ax_app, "AXFocusedWindow")
            if focused is None:
                return WindowSnapshot(app=name, title="", text="")
            title = self._copy(focused, "AXTitle") or ""
            parts = self._collect_text(focused)
            # De-duplicate while preserving order.
            seen, uniq = set(), []
            for p in parts:
                if p not in seen:
                    seen.add(p)
                    uniq.append(p)
            return WindowSnapshot(app=name, title=str(title), text="\n".join(uniq))
        except Exception:
            return None


class FallbackSource:
    """Cross-platform best-effort snapshot (window title only).

    Used off macOS or when Accessibility isn't granted yet — enough to keep
    a live timeline and exercise the pipeline end-to-end.
    """

    def snapshot(self) -> WindowSnapshot | None:
        sysname = platform.system()
        if sysname == "Darwin":
            app = _mac_frontmost_app()
            try:
                title = subprocess.run(
                    ["osascript", "-e",
                     'tell application "System Events" to get title of front window of '
                     f'(first application process whose frontmost is true)'],
                    capture_output=True, text=True, timeout=3,
                ).stdout.strip()
            except Exception:
                title = ""
            return WindowSnapshot(app=app, title=title, text=title)
        if sysname == "Linux":
            for cmd in (["xdotool", "getactivewindow", "getwindowname"],):
                try:
                    title = subprocess.run(cmd, capture_output=True, text=True, timeout=2).stdout.strip()
                    if title:
                        return WindowSnapshot(app="", title=title, text=title)
                except Exception:
                    continue
            return None
        if sysname == "Windows":
            try:
                import ctypes  # type: ignore
                hwnd = ctypes.windll.user32.GetForegroundWindow()
                length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
                buf = ctypes.create_unicode_buffer(length + 1)
                ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
                return WindowSnapshot(app="", title=buf.value, text=buf.value)
            except Exception:
                return None
        return None


def best_source():
    mac = MacOSSource()
    if mac.available:
        return mac, "macos-accessibility"
    return FallbackSource(), "fallback-window-title"
