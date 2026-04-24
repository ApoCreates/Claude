"""
Scans all Telegram dialogs the user is a member of, finds 4K / 1080p videos,
records them in the database, and optionally kicks off downloads.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import AsyncIterator, Callable

from telethon import TelegramClient
from telethon.tl.types import (
    Channel, Chat, Dialog,
    DocumentAttributeVideo,
    Message, MessageMediaDocument,
)

import config
from database import Database
from tagger import classify_aspect_ratio, classify_resolution, extract_tags

logger = logging.getLogger(__name__)


@dataclass
class ScanStats:
    channels_scanned: int = 0
    messages_checked: int = 0
    videos_found: int = 0
    videos_new: int = 0
    started_at: datetime = field(default_factory=datetime.utcnow)
    errors: list[str] = field(default_factory=list)

    @property
    def elapsed(self) -> str:
        delta = datetime.utcnow() - self.started_at
        m, s = divmod(int(delta.total_seconds()), 60)
        return f"{m}m {s}s"


@dataclass
class VideoRecord:
    """Everything we know about a discovered video before downloading."""
    message_id: int
    channel_id: int
    channel_name: str
    file_id: str
    file_name: str
    file_size: int
    resolution: str          # '4K' or '1080p'
    width: int
    height: int
    duration: int            # seconds
    caption: str
    db_id: int = 0           # set after upsert
    tags: list[str] = field(default_factory=list)


# Callback signature: (record, is_new) -> None
OnVideoFound = Callable[[VideoRecord, bool], None]


class Scanner:
    def __init__(
        self,
        client: TelegramClient,
        db: Database,
        on_found: OnVideoFound | None = None,
    ) -> None:
        self.client = client
        self.db = db
        self.on_found = on_found
        self._running = False
        self._stop_event = asyncio.Event()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def is_running(self) -> bool:
        return self._running

    def request_stop(self) -> None:
        self._stop_event.set()

    async def scan_all(
        self,
        limit: int | None = None,
        progress_cb: Callable[[str], None] | None = None,
    ) -> ScanStats:
        """
        Iterate every dialog the user is in, look for 4K / 1080p videos.
        `progress_cb` receives a one-line status string after each channel.
        """
        self._running = True
        self._stop_event.clear()
        stats = ScanStats()

        try:
            dialogs = await self._get_dialogs()
            total = len(dialogs)

            for idx, dialog in enumerate(dialogs, 1):
                if self._stop_event.is_set():
                    break

                name = dialog.name or str(dialog.id)
                if progress_cb:
                    progress_cb(
                        f"[{idx}/{total}] Scanning: {name}"
                    )

                try:
                    found = await self._scan_dialog(dialog, limit or config.SCAN_LIMIT, stats)
                    self.db.update_scan_log(dialog.id, name, found)
                    stats.channels_scanned += 1
                except Exception as exc:
                    msg = f"Error in {name}: {exc}"
                    logger.warning(msg)
                    stats.errors.append(msg)

        finally:
            self._running = False

        return stats

    async def scan_channel(
        self,
        channel_id: int,
        limit: int | None = None,
    ) -> ScanStats:
        """Scan a single channel/group by id."""
        self._running = True
        self._stop_event.clear()
        stats = ScanStats()
        try:
            entity = await self.client.get_entity(channel_id)
            name = getattr(entity, "title", str(channel_id))
            dialog_stub = _DialogStub(entity, name)
            await self._scan_dialog(dialog_stub, limit or config.SCAN_LIMIT, stats)
            self.db.update_scan_log(channel_id, name, stats.videos_found)
            stats.channels_scanned = 1
        finally:
            self._running = False
        return stats

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _get_dialogs(self) -> list[Dialog]:
        dialogs = []
        async for dialog in self.client.iter_dialogs():
            if isinstance(dialog.entity, (Channel, Chat)):
                dialogs.append(dialog)
        logger.info("Found %d channel/group dialogs", len(dialogs))
        return dialogs

    async def _scan_dialog(
        self,
        dialog,
        limit: int | None,
        stats: ScanStats,
    ) -> int:
        """Scan one dialog; return number of qualifying videos found."""
        found_in_this = 0
        entity = dialog.entity if hasattr(dialog, "entity") else dialog

        async for record in self._iter_videos(entity, limit):
            stats.messages_checked += 1

            if record.resolution is None:
                continue

            stats.videos_found += 1
            found_in_this += 1

            db_id = self.db.upsert_video(
                {
                    "message_id":   record.message_id,
                    "channel_id":   record.channel_id,
                    "channel_name": record.channel_name,
                    "file_id":      record.file_id,
                    "file_name":    record.file_name,
                    "file_size":    record.file_size,
                    "resolution":   record.resolution,
                    "aspect_ratio": classify_aspect_ratio(record.width, record.height),
                    "width":        record.width,
                    "height":       record.height,
                    "duration":     record.duration,
                    "caption":      record.caption,
                }
            )
            record.db_id = db_id

            tags = extract_tags(
                caption=record.caption,
                channel_name=record.channel_name,
                file_name=record.file_name,
                resolution=record.resolution,
                duration=record.duration,
                width=record.width,
                height=record.height,
            )
            record.tags = tags
            self.db.add_tags(db_id, tags)

            is_new = db_id not in _seen_ids
            _seen_ids.add(db_id)
            if is_new:
                stats.videos_new += 1

            if self.on_found:
                try:
                    self.on_found(record, is_new)
                except Exception:
                    pass

            if self._stop_event.is_set():
                break

            # Be a good citizen — don't hammer the API
            await asyncio.sleep(0.05)

        return found_in_this

    async def _iter_videos(
        self,
        entity,
        limit: int | None,
    ) -> AsyncIterator[VideoRecord]:
        """Yield VideoRecord for every document message that is a video."""
        channel_name = getattr(entity, "title", str(getattr(entity, "id", "?")))
        channel_id   = getattr(entity, "id", 0)

        async for msg in self.client.iter_messages(entity, limit=limit):
            if self._stop_event.is_set():
                return
            if not isinstance(msg, Message):
                continue
            if not isinstance(msg.media, MessageMediaDocument):
                continue

            doc = msg.media.document
            if doc is None:
                continue

            # Must be a video mime type
            mime = getattr(doc, "mime_type", "") or ""
            if not mime.startswith("video/"):
                continue

            # File size guard
            size = getattr(doc, "size", 0) or 0
            if size > config.MAX_FILE_SIZE:
                continue

            # Look for video attribute (contains dimensions + duration)
            video_attr = None
            for attr in getattr(doc, "attributes", []):
                if isinstance(attr, DocumentAttributeVideo):
                    video_attr = attr
                    break

            width    = getattr(video_attr, "w", 0) or 0
            height   = getattr(video_attr, "h", 0) or 0
            duration = getattr(video_attr, "duration", 0) or 0

            resolution = classify_resolution(width, height) if (width and height) else None

            # Build a best-effort filename
            file_name = _best_filename(doc, channel_name, msg.id)
            caption   = (msg.message or "").strip()
            file_id   = str(doc.id)

            yield VideoRecord(
                message_id=msg.id,
                channel_id=channel_id,
                channel_name=channel_name,
                file_id=file_id,
                file_name=file_name,
                file_size=size,
                resolution=resolution,
                width=width,
                height=height,
                duration=duration,
                caption=caption,
            )


# Module-level set to track which db ids are "new" across a session
_seen_ids: set[int] = set()


# ------------------------------------------------------------------
# Small helpers
# ------------------------------------------------------------------

def _best_filename(doc, channel_name: str, msg_id: int) -> str:
    """Try to get an actual filename from doc attributes, fall back to generated."""
    from telethon.tl.types import DocumentAttributeFilename
    for attr in getattr(doc, "attributes", []):
        if isinstance(attr, DocumentAttributeFilename):
            return attr.file_name
    # Construct a sane default
    safe_ch = "".join(c if c.isalnum() else "_" for c in channel_name)[:30]
    return f"{safe_ch}_{msg_id}.mp4"


class _DialogStub:
    """Minimal stand-in for a Dialog when scanning a single channel."""
    def __init__(self, entity, name: str) -> None:
        self.entity = entity
        self.name   = name
        self.id     = getattr(entity, "id", 0)
