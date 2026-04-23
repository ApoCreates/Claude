import sqlite3
from datetime import datetime
from typing import Any


class Database:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self._init()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init(self) -> None:
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS videos (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id    INTEGER NOT NULL,
                    channel_id    INTEGER NOT NULL,
                    channel_name  TEXT,
                    file_id       TEXT,
                    file_name     TEXT,
                    file_size     INTEGER,
                    resolution    TEXT,        -- '4K' | '1080p'
                    width         INTEGER,
                    height        INTEGER,
                    duration      INTEGER,     -- seconds
                    caption       TEXT,
                    downloaded    INTEGER DEFAULT 0,
                    download_path TEXT,
                    discovered_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(message_id, channel_id)
                );

                CREATE TABLE IF NOT EXISTS tags (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                    tag      TEXT    NOT NULL,
                    UNIQUE(video_id, tag)
                );

                CREATE TABLE IF NOT EXISTS scan_log (
                    channel_id   INTEGER PRIMARY KEY,
                    channel_name TEXT,
                    last_scan    TEXT,
                    total_found  INTEGER DEFAULT 0
                );

                CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
                CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(channel_id);
                CREATE INDEX IF NOT EXISTS idx_videos_resolution ON videos(resolution);
            """)

    # ------------------------------------------------------------------
    # Video operations
    # ------------------------------------------------------------------

    def upsert_video(self, data: dict[str, Any]) -> int:
        """Insert a new video row; update channel_name/resolution on conflict.
        Returns the video's primary key id."""
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO videos
                    (message_id, channel_id, channel_name, file_id, file_name,
                     file_size, resolution, width, height, duration, caption)
                VALUES
                    (:message_id, :channel_id, :channel_name, :file_id, :file_name,
                     :file_size, :resolution, :width, :height, :duration, :caption)
                ON CONFLICT(message_id, channel_id) DO UPDATE SET
                    channel_name = excluded.channel_name,
                    resolution   = excluded.resolution
                RETURNING id
                """,
                data,
            )
            return cur.fetchone()[0]

    def add_tags(self, video_id: int, tags: list[str]) -> None:
        cleaned = [(video_id, t.lower().strip()) for t in tags if t.strip()]
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR IGNORE INTO tags (video_id, tag) VALUES (?, ?)", cleaned
            )

    def mark_downloaded(self, video_id: int, path: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "UPDATE videos SET downloaded=1, download_path=? WHERE id=?",
                (path, video_id),
            )

    def get_video_by_id(self, video_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT v.*, GROUP_CONCAT(t.tag, ', ') AS tags
                FROM videos v
                LEFT JOIN tags t ON t.video_id = v.id
                WHERE v.id = ?
                GROUP BY v.id
                """,
                (video_id,),
            ).fetchone()
            return dict(row) if row else None

    def get_videos(
        self,
        page: int = 0,
        per_page: int = 8,
        tag: str | None = None,
        resolution: str | None = None,
        downloaded_only: bool = False,
    ) -> list[dict]:
        filters = []
        params: list[Any] = []

        if tag:
            filters.append("v.id IN (SELECT video_id FROM tags WHERE tag = ?)")
            params.append(tag.lower().strip())
        if resolution:
            filters.append("v.resolution = ?")
            params.append(resolution)
        if downloaded_only:
            filters.append("v.downloaded = 1")

        where = ("WHERE " + " AND ".join(filters)) if filters else ""
        params += [per_page, page * per_page]

        with self._connect() as conn:
            rows = conn.execute(
                f"""
                SELECT v.*, GROUP_CONCAT(t.tag, ', ') AS tags
                FROM videos v
                LEFT JOIN tags t ON t.video_id = v.id
                {where}
                GROUP BY v.id
                ORDER BY v.discovered_at DESC
                LIMIT ? OFFSET ?
                """,
                params,
            ).fetchall()
            return [dict(r) for r in rows]

    def count_videos(self, tag: str | None = None, resolution: str | None = None) -> int:
        filters = []
        params: list[Any] = []
        if tag:
            filters.append("id IN (SELECT video_id FROM tags WHERE tag = ?)")
            params.append(tag.lower().strip())
        if resolution:
            filters.append("resolution = ?")
            params.append(resolution)
        where = ("WHERE " + " AND ".join(filters)) if filters else ""
        with self._connect() as conn:
            return conn.execute(f"SELECT COUNT(*) FROM videos {where}", params).fetchone()[0]

    # ------------------------------------------------------------------
    # Tag operations
    # ------------------------------------------------------------------

    def get_top_tags(self, limit: int = 50) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT tag, COUNT(*) AS count
                FROM tags
                GROUP BY tag
                ORDER BY count DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Scan tracking
    # ------------------------------------------------------------------

    def update_scan_log(self, channel_id: int, channel_name: str, found: int) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO scan_log (channel_id, channel_name, last_scan, total_found)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(channel_id) DO UPDATE SET
                    channel_name = excluded.channel_name,
                    last_scan    = excluded.last_scan,
                    total_found  = scan_log.total_found + excluded.total_found
                """,
                (channel_id, channel_name, datetime.utcnow().isoformat(), found),
            )

    def get_scanned_channels(self) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM scan_log ORDER BY last_scan DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def get_stats(self) -> dict:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT
                    COUNT(*)                                              AS total,
                    SUM(downloaded)                                       AS downloaded,
                    SUM(CASE WHEN resolution='4K'    THEN 1 ELSE 0 END)  AS count_4k,
                    SUM(CASE WHEN resolution='1080p' THEN 1 ELSE 0 END)  AS count_1080p,
                    SUM(file_size)                                        AS total_bytes
                FROM videos
                """
            ).fetchone()
            return dict(row)
