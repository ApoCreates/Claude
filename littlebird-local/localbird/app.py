"""Application wiring — a single object that owns every subsystem."""

from __future__ import annotations

from .capture import CaptureEngine
from .chat import ChatEngine
from .config import settings
from .connectors import ConnectorSync
from .db import Database
from .images import ImageGenerator
from .insights import InsightsEngine
from .journals import Journal
from .llm import llm
from .meetingwatch import MeetingWatcher
from .memory import Memory
from .routines import Routines
from .scheduler import Scheduler
from .transcription import MeetingService


class LocalBird:
    def __init__(self) -> None:
        settings.ensure_dirs()
        self.db = Database(settings.db_path)
        self.memory = Memory(self.db)
        self.chat = ChatEngine(self.db, self.memory)
        self.journal = Journal(self.db, self.memory)
        self.routines = Routines(self.db, self.chat)
        self.meetings = MeetingService(self.db, self.memory)
        self.images = ImageGenerator()
        self.capture = CaptureEngine(self.memory)
        self.scheduler = Scheduler(self.routines, self.journal)
        self.meetingwatch = MeetingWatcher(self.meetings, self.capture)
        self.connectors = ConnectorSync(self.db, self.memory)
        self.insights = InsightsEngine(self.db)
        self.routines.ensure_starters()

    def start(self) -> None:
        self.capture.start()
        self.scheduler.start()
        self.meetingwatch.start()
        self.connectors.start()
        self.insights.start()

    def stop(self) -> None:
        self.capture.stop()
        self.scheduler.stop()
        self.meetingwatch.stop()
        self.connectors.stop()
        self.insights.stop()

    def status(self) -> dict:
        return {
            "version": __import__("localbird").__version__,
            "llm": llm.status(),
            "capture": self.capture.status(),
            "meetings": self.meetings.status(),
            "meetingwatch": self.meetingwatch.status(),
            "connectors": self.connectors.status(),
            "insights": self.insights.status(),
            "images": self.images.status(),
            "memory": self.memory.stats(),
            "data_dir": str(settings.data_dir),
        }


_instance: LocalBird | None = None


def get_app() -> LocalBird:
    global _instance
    if _instance is None:
        _instance = LocalBird()
    return _instance
