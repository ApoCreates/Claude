import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Telegram API credentials — get from https://my.telegram.org
API_ID: int = int(os.getenv("API_ID", "0"))
API_HASH: str = os.getenv("API_HASH", "")

# Bot token from @BotFather
BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

# Your phone number for the user session (E.164 format, e.g. +15550001234)
PHONE_NUMBER: str = os.getenv("PHONE_NUMBER", "")

# Telegram user IDs allowed to control the bot
_raw_auth = os.getenv("AUTHORIZED_USERS", "")
AUTHORIZED_USERS: list[int] = [
    int(uid.strip()) for uid in _raw_auth.split(",") if uid.strip().lstrip("-").isdigit()
]

# Session file name (no extension)
SESSION_NAME: str = os.getenv("SESSION_NAME", "video_scanner")

# Where downloaded videos are saved
DOWNLOAD_PATH: Path = Path(os.getenv("DOWNLOAD_PATH", "./downloads"))

# SQLite database path
DB_PATH: str = os.getenv("DB_PATH", "videos.db")

# Resolution thresholds (width x height)
RESOLUTION_4K   = (3840, 2160)
RESOLUTION_1080 = (1920, 1080)

# How many messages to scan per channel/group (None = all)
SCAN_LIMIT: int | None = int(os.getenv("SCAN_LIMIT", "2000")) or None

# Maximum video file size to download (bytes). Default 8 GB.
MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE_GB", "8")) * 1024 ** 3

# Concurrent downloads
MAX_CONCURRENT_DOWNLOADS: int = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "2"))


def validate() -> list[str]:
    """Return a list of missing / invalid config values."""
    errors = []
    if not API_ID:
        errors.append("API_ID is not set")
    if not API_HASH:
        errors.append("API_HASH is not set")
    if not BOT_TOKEN:
        errors.append("BOT_TOKEN is not set")
    if not PHONE_NUMBER:
        errors.append("PHONE_NUMBER is not set")
    return errors
