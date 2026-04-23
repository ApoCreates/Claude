"""
Telegram bot command handlers (Telethon bot client).

Commands
--------
/start          – Welcome message + quick help
/scan [limit]   – Scan all joined channels/groups for HD videos
/stop           – Abort an active scan
/status         – Live download queue status
/list [page]    – Browse discovered videos (paginated, 8 per page)
/search <tag>   – Filter videos by tag
/tags           – Top-50 tags with counts
/download <id>  – Queue a video for download by its DB id
/stats          – Overall counts and storage figures
/help           – Command reference
"""

import asyncio
import logging
from typing import Callable

from telethon import TelegramClient, events, Button
from telethon.tl.types import Message

import config
from database import Database
from downloader import Downloader, DownloadJob, _fmt_size, _fmt_duration
from scanner import Scanner, ScanStats, VideoRecord

logger = logging.getLogger(__name__)

# Width of the page for /list
PAGE_SIZE = 8


def register_handlers(
    bot: TelegramClient,
    user_client: TelegramClient,
    scanner: Scanner,
    downloader: Downloader,
    db: Database,
) -> None:
    """Attach all event handlers to *bot*."""

    # ------------------------------------------------------------------ #
    # Auth guard
    # ------------------------------------------------------------------ #

    def _authorised(event) -> bool:
        if not config.AUTHORIZED_USERS:
            return True
        return event.sender_id in config.AUTHORIZED_USERS

    async def _deny(event):
        await event.respond("Not authorised.")

    # ------------------------------------------------------------------ #
    # /start  /help
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/start$"))
    async def cmd_start(event):
        if not _authorised(event):
            return await _deny(event)
        await event.respond(
            "**TG Video Bot**\n\n"
            "Finds 4K and 1080p videos in your Telegram channels & groups.\n\n"
            "Quick commands:\n"
            "  /scan — discover HD videos in all joined chats\n"
            "  /list — browse discovered videos\n"
            "  /tags — explore tags\n"
            "  /search <tag> — filter by tag\n"
            "  /stats — overall summary\n"
            "  /help — full command list"
        )

    @bot.on(events.NewMessage(pattern=r"^/help$"))
    async def cmd_help(event):
        if not _authorised(event):
            return await _deny(event)
        await event.respond(
            "**Commands**\n\n"
            "`/scan [limit]` — scan all channels (optional msg limit per channel)\n"
            "`/stop` — stop an active scan\n"
            "`/status` — download queue status\n"
            "`/list [page]` — browse videos (page starts at 1)\n"
            "`/list 4k` or `/list 1080p` — filter by resolution\n"
            "`/search <tag>` — filter by tag\n"
            "`/tags` — top tags with counts\n"
            "`/download <id>` — queue video #id for download\n"
            "`/stats` — database summary\n"
        )

    # ------------------------------------------------------------------ #
    # /scan
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/scan(?:\s+(\d+))?$"))
    async def cmd_scan(event):
        if not _authorised(event):
            return await _deny(event)
        if scanner.is_running:
            await event.respond("Scan already in progress. Use /stop to cancel.")
            return

        limit_arg = event.pattern_match.group(1)
        limit = int(limit_arg) if limit_arg else None

        status_msg: Message = await event.respond("Starting scan…")

        _last_update = {"text": ""}

        def progress_cb(text: str) -> None:
            _last_update["text"] = text

        async def run_scan():
            stats: ScanStats = await scanner.scan_all(
                limit=limit,
                progress_cb=progress_cb,
            )
            summary = _scan_summary(stats)
            try:
                await bot.edit_message(
                    status_msg.input_chat,
                    status_msg.id,
                    summary,
                )
            except Exception:
                await event.respond(summary)

        # Update the status message every 3 s while the scan runs
        async def ticker():
            while scanner.is_running:
                await asyncio.sleep(3)
                txt = _last_update["text"]
                if txt:
                    try:
                        await bot.edit_message(
                            status_msg.input_chat,
                            status_msg.id,
                            f"Scanning…\n\n`{txt}`",
                        )
                    except Exception:
                        pass

        asyncio.create_task(ticker())
        asyncio.create_task(run_scan())

    @bot.on(events.NewMessage(pattern=r"^/stop$"))
    async def cmd_stop(event):
        if not _authorised(event):
            return await _deny(event)
        if not scanner.is_running:
            await event.respond("No scan running.")
            return
        scanner.request_stop()
        await event.respond("Stop requested — finishing current channel…")

    # ------------------------------------------------------------------ #
    # /status
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/status$"))
    async def cmd_status(event):
        if not _authorised(event):
            return await _deny(event)
        active = downloader.active_jobs()
        queued = downloader.queue_size()
        done   = downloader.recent_done(5)

        lines = ["**Download Status**\n"]

        if scanner.is_running:
            lines.append("Scan: **running**")
        else:
            lines.append("Scan: idle")

        lines.append(f"Queue: {queued} waiting  •  {len(active)} active\n")

        if active:
            lines.append("**Active:**")
            for j in active:
                lines.append(f"  `{j.record.file_name[:40]}` — {j.status_line()}")

        if done:
            lines.append("\n**Recent:**")
            for j in done:
                icon = "✓" if j.status == "done" else "✗"
                lines.append(f"  {icon} `{j.record.file_name[:40]}` — {j.status_line()}")

        await event.respond("\n".join(lines))

    # ------------------------------------------------------------------ #
    # /list
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/list(?:\s+(.+))?$"))
    async def cmd_list(event):
        if not _authorised(event):
            return await _deny(event)
        arg = (event.pattern_match.group(1) or "1").strip().lower()

        # Resolve resolution filter and page
        resolution = None
        page = 1

        if arg in ("4k", "4K"):
            resolution = "4K"
        elif arg in ("1080p", "1080", "hd"):
            resolution = "1080p"
        elif arg.isdigit():
            page = max(1, int(arg))

        videos = db.get_videos(page=page - 1, per_page=PAGE_SIZE, resolution=resolution)
        total  = db.count_videos(resolution=resolution)
        pages  = max(1, -(-total // PAGE_SIZE))  # ceiling division

        if not videos:
            await event.respond("No videos found. Run /scan first.")
            return

        lines = [f"**Videos** (page {page}/{pages}  •  {total} total)\n"]
        for v in videos:
            dl_icon = "✓" if v["downloaded"] else "·"
            dur = _fmt_duration(v["duration"] or 0)
            size = _fmt_size(v["file_size"] or 0)
            tags_preview = (v["tags"] or "")[:60]
            lines.append(
                f"{dl_icon} **#{v['id']}** `{v['file_name'][:35]}`\n"
                f"   {v['resolution']} • {v['width']}x{v['height']} • {dur} • {size}\n"
                f"   {v['channel_name']}\n"
                f"   Tags: {tags_preview}\n"
                f"   /download {v['id']}"
            )
            if len(v.get("caption") or "") > 0:
                lines.append(f"   _{v['caption'][:80]}_")
            lines.append("")

        nav = []
        if page > 1:
            nav.append(f"/list {page-1}")
        if page < pages:
            nav.append(f"/list {page+1}")
        if nav:
            lines.append("  ".join(nav))

        await event.respond("\n".join(lines))

    # ------------------------------------------------------------------ #
    # /search
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/search\s+(.+)$"))
    async def cmd_search(event):
        if not _authorised(event):
            return await _deny(event)
        tag = event.pattern_match.group(1).strip().lower()
        videos = db.get_videos(tag=tag, per_page=PAGE_SIZE)
        total  = db.count_videos(tag=tag)

        if not videos:
            await event.respond(f"No videos tagged `{tag}`.")
            return

        lines = [f"**Videos tagged** `{tag}` ({total} total)\n"]
        for v in videos:
            size = _fmt_size(v["file_size"] or 0)
            lines.append(
                f"**#{v['id']}** `{v['file_name'][:35]}`\n"
                f"   {v['resolution']} • {v['channel_name']} • {size}\n"
                f"   /download {v['id']}\n"
            )
        await event.respond("\n".join(lines))

    # ------------------------------------------------------------------ #
    # /tags
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/tags$"))
    async def cmd_tags(event):
        if not _authorised(event):
            return await _deny(event)
        tags = db.get_top_tags(50)
        if not tags:
            await event.respond("No tags yet. Run /scan first.")
            return
        lines = ["**Top Tags**\n"]
        for row in tags:
            lines.append(f"`{row['tag']}` ({row['count']})")
        await event.respond("  •  ".join(lines[1:]))

    # ------------------------------------------------------------------ #
    # /download <id>
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/download\s+(\d+)$"))
    async def cmd_download(event):
        if not _authorised(event):
            return await _deny(event)
        vid_id = int(event.pattern_match.group(1))
        video = db.get_video_by_id(vid_id)
        if not video:
            await event.respond(f"Video #{vid_id} not found.")
            return
        if video["downloaded"]:
            await event.respond(
                f"#{vid_id} already downloaded.\nPath: `{video['download_path']}`"
            )
            return

        record = VideoRecord(
            message_id=video["message_id"],
            channel_id=video["channel_id"],
            channel_name=video["channel_name"] or "",
            file_id=video["file_id"] or "",
            file_name=video["file_name"] or f"video_{vid_id}.mp4",
            file_size=video["file_size"] or 0,
            resolution=video["resolution"] or "1080p",
            width=video["width"] or 0,
            height=video["height"] or 0,
            duration=video["duration"] or 0,
            caption=video["caption"] or "",
            db_id=video["id"],
        )

        job = downloader.enqueue(record)
        if job is None:
            await event.respond(f"#{vid_id} is already in the queue.")
        else:
            await event.respond(
                f"Queued **#{vid_id}** for download.\n"
                f"`{record.file_name}`  •  {record.resolution}  •  "
                f"{_fmt_size(record.file_size)}\n\n"
                "Use /status to track progress."
            )

    # ------------------------------------------------------------------ #
    # /stats
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/stats$"))
    async def cmd_stats(event):
        if not _authorised(event):
            return await _deny(event)
        s = db.get_stats()
        scanned = db.get_scanned_channels()
        total_bytes = s["total_bytes"] or 0
        lines = [
            "**Database Stats**\n",
            f"Total videos found : {s['total'] or 0}",
            f"  — 4K             : {s['count_4k'] or 0}",
            f"  — 1080p          : {s['count_1080p'] or 0}",
            f"Downloaded         : {s['downloaded'] or 0}",
            f"Indexed file size  : {_fmt_size(total_bytes)}",
            f"\nChannels scanned   : {len(scanned)}",
        ]
        await event.respond("\n".join(lines))


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _scan_summary(stats: ScanStats) -> str:
    lines = [
        "**Scan complete**\n",
        f"Channels scanned : {stats.channels_scanned}",
        f"Messages checked : {stats.messages_checked}",
        f"HD videos found  : {stats.videos_found}",
        f"New this scan    : {stats.videos_new}",
        f"Duration         : {stats.elapsed}",
    ]
    if stats.errors:
        lines.append(f"\nErrors ({len(stats.errors)}):")
        for e in stats.errors[:5]:
            lines.append(f"  • {e}")
    lines.append("\nUse /list to browse or /download <id> to save.")
    return "\n".join(lines)
