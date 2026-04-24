"""
Telegram bot command handlers (Telethon bot client).

Commands
--------
/start              – Welcome message + quick help
/scan [limit]       – Scan all joined channels/groups for HD videos
/stop               – Abort an active scan
/status             – Live download queue status
/list [tokens…]     – Browse videos with optional filters (see /help)
/filter <type> …    – Custom duration-range or aspect-ratio filter
/search <tag>       – Filter videos by tag
/tags               – Top-50 tags with counts
/download <id>      – Queue a video for download by its DB id
/stats              – Overall counts and storage figures
/help               – Command reference
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
from tagger import ASPECT_LABELS, _DUR_SHORT, _DUR_MEDIUM

logger = logging.getLogger(__name__)

PAGE_SIZE = 8

# Named duration buckets → (min_sec, max_sec or None)
_DURATION_BUCKETS: dict[str, tuple[int | None, int | None]] = {
    "short":  (None, _DUR_SHORT),
    "medium": (_DUR_SHORT, _DUR_MEDIUM),
    "long":   (_DUR_MEDIUM, None),
}

# All keyword tokens /list understands
_RESOLUTION_MAP = {"4k": "4K", "1080p": "1080p", "1080": "1080p", "hd": "1080p"}
_ASPECT_SET     = set(ASPECT_LABELS)          # portrait square standard widescreen ultrawide
_DURATION_SET   = set(_DURATION_BUCKETS)      # short medium long


def _parse_list_tokens(raw: str) -> dict:
    """
    Parse the free-form argument string for /list into a filter dict.
    Accepts any combination of:
      resolution  — 4k | 1080p | hd
      aspect      — portrait | square | standard | widescreen | ultrawide
      duration    — short | medium | long
      page        — bare integer (default 1)
    Order is irrelevant; unknown tokens are silently ignored.
    """
    result: dict = {
        "resolution": None,
        "aspect_ratio": None,
        "duration_min": None,
        "duration_max": None,
        "page": 1,
    }
    for tok in raw.lower().split():
        if tok in _RESOLUTION_MAP:
            result["resolution"] = _RESOLUTION_MAP[tok]
        elif tok in _ASPECT_SET:
            result["aspect_ratio"] = tok
        elif tok in _DURATION_SET:
            dmin, dmax = _DURATION_BUCKETS[tok]
            result["duration_min"] = dmin
            result["duration_max"] = dmax
        elif tok.isdigit():
            result["page"] = max(1, int(tok))
    return result


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
            "  /list 4k portrait short — combine filters freely\n"
            "  /filter duration 5 20 — custom duration range (minutes)\n"
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
            "`/scan [limit]` — scan all channels (optional per-channel message limit)\n"
            "`/stop` — stop an active scan\n"
            "`/status` — live download queue\n\n"
            "**Browse & filter** (mix any tokens freely):\n"
            "`/list` — all videos, page 1\n"
            "`/list 4k` / `/list 1080p` — by resolution\n"
            "`/list portrait` — vertical / phone-shot videos (9:16)\n"
            "`/list square` — ~1:1 ratio\n"
            "`/list standard` — 4:3 and similar\n"
            "`/list widescreen` — 16:9 and similar\n"
            "`/list ultrawide` — 21:9 and wider (cinema)\n"
            "`/list short` — under 2 minutes\n"
            "`/list medium` — 2–20 minutes\n"
            "`/list long` — over 20 minutes\n"
            "`/list 4k widescreen long 2` — combine + page 2\n\n"
            "**Custom duration range:**\n"
            "`/filter duration 5 30` — videos between 5 and 30 minutes\n"
            "`/filter duration 60` — videos over 60 minutes\n\n"
            "**Other:**\n"
            "`/search <tag>` — filter by any tag\n"
            "`/tags` — top-50 tags with counts\n"
            "`/download <id>` — queue video for download\n"
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
        raw = (event.pattern_match.group(1) or "").strip()
        f   = _parse_list_tokens(raw)
        page = f["page"]

        videos = db.get_videos(
            page=page - 1,
            per_page=PAGE_SIZE,
            resolution=f["resolution"],
            aspect_ratio=f["aspect_ratio"],
            duration_min=f["duration_min"],
            duration_max=f["duration_max"],
        )
        total = db.count_videos(
            resolution=f["resolution"],
            aspect_ratio=f["aspect_ratio"],
            duration_min=f["duration_min"],
            duration_max=f["duration_max"],
        )
        pages = max(1, -(-total // PAGE_SIZE))

        if not videos:
            await event.respond("No videos match those filters. Try /list or /scan first.")
            return

        # Build a human-readable description of the active filters
        active = []
        if f["resolution"]:
            active.append(f["resolution"])
        if f["aspect_ratio"]:
            active.append(f["aspect_ratio"])
        if f["duration_min"] is not None or f["duration_max"] is not None:
            dmin = f["duration_min"] or 0
            dmax = f["duration_max"]
            active.append(
                f">{dmin//60}min" if dmax is None else
                f"<{dmax//60}min" if dmin == 0 else
                f"{dmin//60}-{dmax//60}min"
            )
        filter_label = "  ".join(active) or "all"

        lines = [f"**Videos** [{filter_label}]  page {page}/{pages}  •  {total} total\n"]
        for v in videos:
            dl_icon = "✓" if v["downloaded"] else "·"
            dur  = _fmt_duration(v["duration"] or 0)
            size = _fmt_size(v["file_size"] or 0)
            ar   = v.get("aspect_ratio") or "?"
            tags_preview = (v["tags"] or "")[:60]
            lines.append(
                f"{dl_icon} **#{v['id']}** `{v['file_name'][:35]}`\n"
                f"   {v['resolution']} • {ar} • {v['width']}x{v['height']} • {dur} • {size}\n"
                f"   {v['channel_name']}\n"
                f"   Tags: {tags_preview}\n"
                f"   /download {v['id']}"
            )
            if v.get("caption"):
                lines.append(f"   _{v['caption'][:80]}_")
            lines.append("")

        # Navigation — preserve the filter tokens in the nav links
        filter_tokens = " ".join(
            t for t in [
                raw.replace(str(page), "").strip() if raw.strip().isdigit() else
                " ".join(tok for tok in raw.split() if not tok.isdigit())
            ] if t
        ).strip()

        nav = []
        if page > 1:
            nav.append(f"/list {filter_tokens} {page-1}".strip())
        if page < pages:
            nav.append(f"/list {filter_tokens} {page+1}".strip())
        if nav:
            lines.append("  ".join(nav))

        await event.respond("\n".join(lines))

    # ------------------------------------------------------------------ #
    # /filter
    # ------------------------------------------------------------------ #

    @bot.on(events.NewMessage(pattern=r"^/filter\s+(.+)$"))
    async def cmd_filter(event):
        if not _authorised(event):
            return await _deny(event)
        parts = event.pattern_match.group(1).strip().lower().split()

        if not parts:
            await event.respond("Usage: `/filter duration 5 30` or `/filter aspect portrait`")
            return

        kind = parts[0]

        # /filter duration MIN [MAX]  (minutes)
        if kind == "duration":
            nums = [p for p in parts[1:] if p.isdigit()]
            if not nums:
                await event.respond(
                    "Usage: `/filter duration MIN [MAX]` (in minutes)\n"
                    "Example: `/filter duration 5 30` — 5 to 30 min\n"
                    "Example: `/filter duration 60` — over 60 min"
                )
                return
            dmin_s = int(nums[0]) * 60
            dmax_s = int(nums[1]) * 60 if len(nums) >= 2 else None

            videos = db.get_videos(
                duration_min=dmin_s,
                duration_max=dmax_s,
                per_page=PAGE_SIZE,
            )
            total = db.count_videos(duration_min=dmin_s, duration_max=dmax_s)

            if not videos:
                label = (
                    f"{nums[0]}–{nums[1]} min" if len(nums) >= 2
                    else f">{nums[0]} min"
                )
                await event.respond(f"No videos found for duration {label}.")
                return

            label = f"{nums[0]}–{nums[1]} min" if len(nums) >= 2 else f">{nums[0]} min"
            lines = [f"**Videos** [duration: {label}]  {total} total\n"]
            for v in videos:
                dur  = _fmt_duration(v["duration"] or 0)
                size = _fmt_size(v["file_size"] or 0)
                ar   = v.get("aspect_ratio") or "?"
                lines.append(
                    f"**#{v['id']}** `{v['file_name'][:35]}`\n"
                    f"   {v['resolution']} • {ar} • {dur} • {size}\n"
                    f"   {v['channel_name']}\n"
                    f"   /download {v['id']}\n"
                )
            await event.respond("\n".join(lines))
            return

        # /filter aspect <label>
        if kind in ("aspect", "ratio", "ar"):
            if len(parts) < 2 or parts[1] not in _ASPECT_SET:
                await event.respond(
                    "Usage: `/filter aspect <label>`\n"
                    "Labels: `portrait`  `square`  `standard`  `widescreen`  `ultrawide`"
                )
                return
            ar_filter = parts[1]
            videos = db.get_videos(aspect_ratio=ar_filter, per_page=PAGE_SIZE)
            total  = db.count_videos(aspect_ratio=ar_filter)
            if not videos:
                await event.respond(f"No `{ar_filter}` videos found.")
                return
            lines = [f"**Videos** [aspect: {ar_filter}]  {total} total\n"]
            for v in videos:
                dur  = _fmt_duration(v["duration"] or 0)
                size = _fmt_size(v["file_size"] or 0)
                lines.append(
                    f"**#{v['id']}** `{v['file_name'][:35]}`\n"
                    f"   {v['resolution']} • {v['width']}x{v['height']} • {dur} • {size}\n"
                    f"   {v['channel_name']}\n"
                    f"   /download {v['id']}\n"
                )
            await event.respond("\n".join(lines))
            return

        await event.respond(
            "Unknown filter type.\n"
            "Try `/filter duration 5 30` or `/filter aspect portrait`."
        )

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
            f"Indexed size       : {_fmt_size(total_bytes)}",
            f"\n**Aspect ratio**",
            f"  portrait         : {s['ar_portrait'] or 0}",
            f"  square           : {s['ar_square'] or 0}",
            f"  standard (4:3)   : {s['ar_standard'] or 0}",
            f"  widescreen (16:9): {s['ar_widescreen'] or 0}",
            f"  ultrawide (21:9+): {s['ar_ultrawide'] or 0}",
            f"\n**Duration**",
            f"  short  (<2 min)  : {s['dur_short'] or 0}",
            f"  medium (2-20 min): {s['dur_medium'] or 0}",
            f"  long   (>20 min) : {s['dur_long'] or 0}",
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
