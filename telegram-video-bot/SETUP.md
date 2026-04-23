# TG Video Bot — Setup Guide

Scans every Telegram channel and group you are a member of for 4K and 1080p
videos, downloads them, and auto-tags each video based on its caption, channel
name, and filename.

---

## Prerequisites

- Python 3.11+
- A Telegram account already joined to the channels / groups you want to scan

---

## 1 — Get API credentials

1. Go to <https://my.telegram.org> and log in.
2. Click **API Development Tools**.
3. Create a new application (any name / platform).
4. Copy **App api_id** and **App api_hash**.

## 2 — Create a bot

1. Open Telegram and message **@BotFather**.
2. Send `/newbot` and follow the prompts.
3. Copy the bot token (looks like `1234567890:ABCdef…`).

## 3 — Find your Telegram user ID

Message **@userinfobot** on Telegram — it replies with your numeric user ID.

## 4 — Configure

```bash
cp .env.example .env
# Edit .env with your API_ID, API_HASH, BOT_TOKEN, PHONE_NUMBER,
# and your user ID in AUTHORIZED_USERS
```

## 5 — Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The optional `cryptg` package accelerates uploads/downloads via C bindings —
it is installed automatically from requirements.txt but will fall back to pure
Python if compilation fails.

## 6 — First run (interactive auth)

```bash
python main.py
```

Telethon will ask for your phone number and the verification code sent by
Telegram.  The session is saved to `video_scanner.session` — subsequent starts
are fully automatic.

## 7 — Use the bot

Open Telegram, find your bot, and send:

| Command | What it does |
|---------|--------------|
| `/scan` | Scan all joined channels (up to `SCAN_LIMIT` msgs each) |
| `/scan 500` | Scan with a custom per-channel message limit |
| `/stop` | Abort a running scan |
| `/list` | Browse discovered videos (8 per page) |
| `/list 4k` | Filter to 4K only |
| `/list 1080p` | Filter to 1080p only |
| `/list 2` | Go to page 2 |
| `/search documentary` | Find videos tagged "documentary" |
| `/tags` | See the top 50 tags |
| `/download 42` | Queue video #42 for download |
| `/status` | Live download queue view |
| `/stats` | Total counts and storage figures |
| `/help` | Full command reference |

---

## Directory layout

```
downloads/
  4k/      ← 4K videos
  1080p/   ← 1080p videos
videos.db  ← SQLite database (metadata + tags)
video_scanner.session  ← Telethon user session (keep private)
bot_session.session    ← Telethon bot session
```

## Running as a service (systemd)

```ini
[Unit]
Description=TG Video Bot
After=network.target

[Service]
WorkingDirectory=/path/to/telegram-video-bot
ExecStart=/path/to/.venv/bin/python main.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save to `/etc/systemd/system/tgvidbot.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tgvidbot
```

---

## How tags are generated

Each discovered video is tagged from five sources:

1. **Resolution** — `4k` or `1080p`
2. **Duration bucket** — `short_clip` (<1 min), `medium_length` (<10 min), `long_video`
3. **Channel/group name** — slug-ified as `src_<name>` plus individual words
4. **Caption hashtags** — `#documentary` → `documentary`
5. **Caption keywords** — significant words after stop-word removal
6. **Filename keywords** — same treatment on the stem of the filename

Multi-word concepts are joined with `_` (e.g. `nature_documentary`).
