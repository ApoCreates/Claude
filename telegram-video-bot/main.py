"""
Entry point for the TG Video Bot.

Two Telethon sessions are run concurrently:
  • user_client  – logs in as your personal account to read channels/groups
  • bot_client   – bot token session that handles user commands

Run once interactively so Telethon can save the session file, then start
as a background service (systemd, screen, tmux, etc.).
"""

import asyncio
import logging
import sys
from pathlib import Path

from telethon import TelegramClient

import config
from database import Database
from scanner import Scanner
from downloader import Downloader
from bot_handlers import register_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    # ------------------------------------------------------------------
    # Validate config
    # ------------------------------------------------------------------
    errors = config.validate()
    if errors:
        for err in errors:
            logger.error("Config error: %s", err)
        logger.error("Copy .env.example to .env and fill in the required values.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # Create download directory
    # ------------------------------------------------------------------
    config.DOWNLOAD_PATH.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    db = Database(config.DB_PATH)
    logger.info("Database ready at %s", config.DB_PATH)

    # ------------------------------------------------------------------
    # Telethon clients
    # ------------------------------------------------------------------

    # User client — full MTProto access to joined channels/groups
    user_client = TelegramClient(
        config.SESSION_NAME,
        config.API_ID,
        config.API_HASH,
    )

    # Bot client — only handles incoming /commands
    bot_client = TelegramClient(
        "bot_session",
        config.API_ID,
        config.API_HASH,
    )

    # ------------------------------------------------------------------
    # Wire up components
    # ------------------------------------------------------------------

    scanner    = Scanner(client=user_client, db=db)
    downloader = Downloader(client=user_client, db=db)

    register_handlers(
        bot=bot_client,
        user_client=user_client,
        scanner=scanner,
        downloader=downloader,
        db=db,
    )

    # ------------------------------------------------------------------
    # Start
    # ------------------------------------------------------------------
    logger.info("Starting user client…")
    await user_client.start(phone=config.PHONE_NUMBER)

    me = await user_client.get_me()
    logger.info("Logged in as %s (id=%s)", me.first_name, me.id)

    logger.info("Starting bot client…")
    await bot_client.start(bot_token=config.BOT_TOKEN)

    bot_me = await bot_client.get_me()
    logger.info("Bot running as @%s", bot_me.username)

    downloader.start()
    logger.info("Downloader workers started")

    logger.info("All systems ready. Waiting for commands…")

    await asyncio.gather(
        user_client.run_until_disconnected(),
        bot_client.run_until_disconnected(),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down.")
