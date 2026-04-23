"""
Manages an async download queue for Telegram video files.
Uses the user client (Telethon MTProto) for full-speed downloads.
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from telethon import TelegramClient
from telethon.tl.types import Message

import config
from database import Database
from scanner import VideoRecord

logger = logging.getLogger(__name__)


@dataclass
class DownloadJob:
    record: VideoRecord
    status: str = "queued"      # queued | downloading | done | failed
    progress: float = 0.0       # 0.0 – 1.0
    speed_bps: float = 0.0      # bytes per second
    error: str = ""
    started_at: float = field(default_factory=time.monotonic)
    finished_at: float = 0.0

    @property
    def elapsed(self) -> float:
        end = self.finished_at or time.monotonic()
        return end - self.started_at

    @property
    def eta_seconds(self) -> float:
        if self.speed_bps <= 0 or self.progress <= 0:
            return 0.0
        remaining_bytes = self.record.file_size * (1.0 - self.progress)
        return remaining_bytes / self.speed_bps

    def status_line(self) -> str:
        pct = f"{self.progress * 100:.1f}%"
        spd = _fmt_speed(self.speed_bps)
        eta = _fmt_duration(int(self.eta_seconds))
        size = _fmt_size(self.record.file_size)
        if self.status == "downloading":
            return f"{pct} of {size}  {spd}  ETA {eta}"
        if self.status == "done":
            return f"Done ({size} in {_fmt_duration(int(self.elapsed))})"
        if self.status == "failed":
            return f"Failed: {self.error}"
        return self.status


# Called when a job's status changes: (job) -> None
OnJobUpdate = Callable[[DownloadJob], None]


class Downloader:
    def __init__(
        self,
        client: TelegramClient,
        db: Database,
        download_dir: Path | None = None,
        on_update: OnJobUpdate | None = None,
    ) -> None:
        self.client       = client
        self.db           = db
        self.download_dir = download_dir or config.DOWNLOAD_PATH
        self.on_update    = on_update

        self._queue: asyncio.Queue[DownloadJob] = asyncio.Queue()
        self._active: dict[int, DownloadJob] = {}   # db_id -> job
        self._done:   dict[int, DownloadJob] = {}   # db_id -> job
        self._workers: list[asyncio.Task] = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self, n_workers: int | None = None) -> None:
        n = n_workers or config.MAX_CONCURRENT_DOWNLOADS
        for _ in range(n):
            task = asyncio.create_task(self._worker())
            self._workers.append(task)
        logger.info("Downloader started with %d workers", n)

    async def stop(self) -> None:
        for task in self._workers:
            task.cancel()
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()

    def enqueue(self, record: VideoRecord) -> DownloadJob | None:
        """Add a video to the download queue. Returns None if already queued/active."""
        db_id = record.db_id
        if db_id in self._active or db_id in self._done:
            return None
        job = DownloadJob(record=record)
        self._active[db_id] = job
        self._queue.put_nowait(job)
        logger.debug("Enqueued db_id=%d  %s", db_id, record.file_name)
        return job

    def queue_size(self) -> int:
        return self._queue.qsize()

    def active_jobs(self) -> list[DownloadJob]:
        return [j for j in self._active.values() if j.status == "downloading"]

    def recent_done(self, limit: int = 10) -> list[DownloadJob]:
        jobs = sorted(self._done.values(), key=lambda j: j.finished_at, reverse=True)
        return jobs[:limit]

    # ------------------------------------------------------------------
    # Worker
    # ------------------------------------------------------------------

    async def _worker(self) -> None:
        while True:
            job = await self._queue.get()
            try:
                await self._download(job)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                job.status = "failed"
                job.error  = str(exc)
                job.finished_at = time.monotonic()
                logger.error("Download failed db_id=%d: %s", job.record.db_id, exc)
                self._notify(job)
            finally:
                self._active.pop(job.record.db_id, None)
                self._done[job.record.db_id] = job
                self._queue.task_done()

    async def _download(self, job: DownloadJob) -> None:
        record = job.record
        job.status = "downloading"
        self._notify(job)

        self.download_dir.mkdir(parents=True, exist_ok=True)

        # Resolve destination path (avoid overwriting existing files)
        dest = self._unique_path(record.file_name, record.resolution)

        # Fetch the original Telegram message so Telethon can stream it
        try:
            msg: Message = await self.client.get_messages(
                record.channel_id, ids=record.message_id
            )
        except Exception as exc:
            raise RuntimeError(f"Could not fetch message: {exc}") from exc

        if msg is None or not msg.media:
            raise RuntimeError("Message or media not found")

        start_time  = time.monotonic()
        last_bytes  = 0
        last_update = start_time

        def _progress(received: int, total: int) -> None:
            nonlocal last_bytes, last_update
            now = time.monotonic()
            dt  = now - last_update
            if dt >= 1.0:
                speed = (received - last_bytes) / dt
                job.speed_bps = speed
                last_bytes    = received
                last_update   = now
            job.progress = received / total if total else 0.0
            self._notify(job)

        path = await self.client.download_media(
            msg.media,
            file=str(dest),
            progress_callback=_progress,
        )

        job.status      = "done"
        job.progress    = 1.0
        job.finished_at = time.monotonic()

        self.db.mark_downloaded(record.db_id, str(path))
        logger.info("Downloaded %s -> %s", record.file_name, path)
        self._notify(job)

    def _notify(self, job: DownloadJob) -> None:
        if self.on_update:
            try:
                self.on_update(job)
            except Exception:
                pass

    def _unique_path(self, file_name: str, resolution: str) -> Path:
        """Return a path that doesn't collide with existing files."""
        res_dir = self.download_dir / resolution.lower()
        res_dir.mkdir(parents=True, exist_ok=True)
        dest = res_dir / file_name
        if not dest.exists():
            return dest
        stem   = dest.stem
        suffix = dest.suffix
        idx    = 1
        while True:
            candidate = res_dir / f"{stem}_{idx}{suffix}"
            if not candidate.exists():
                return candidate
            idx += 1


# ------------------------------------------------------------------
# Formatting helpers
# ------------------------------------------------------------------

def _fmt_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def _fmt_speed(bps: float) -> str:
    return _fmt_size(int(bps)) + "/s"


def _fmt_duration(secs: int) -> str:
    if secs < 60:
        return f"{secs}s"
    m, s = divmod(secs, 60)
    if m < 60:
        return f"{m}m{s:02d}s"
    h, m = divmod(m, 60)
    return f"{h}h{m:02d}m"
