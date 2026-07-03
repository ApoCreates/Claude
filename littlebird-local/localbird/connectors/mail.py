"""Apple Mail connector.

Reads the most recent inbox messages via AppleScript and ingests new ones
into memory (kind="email") so chat, journals and briefings know about your
mail. Works with any account added to the macOS Mail app (iCloud, Gmail,
Exchange…) — entirely locally.
"""

from __future__ import annotations

import json

from ..config import settings
from . import applescript as osa

_SCRIPT = """
set fieldSep to "{field}"
set recSep to "{record}"
set out to ""
tell application "Mail"
    set msgs to messages 1 thru {limit} of inbox
    repeat with m in msgs
        try
            set msgId to message id of m
            set msgSubject to subject of m
            set msgSender to sender of m
            set msgDate to (date received of m) as string
            set msgBody to content of m
            if (count of characters of msgBody) > 900 then
                set msgBody to text 1 thru 900 of msgBody
            end if
            set out to out & msgId & fieldSep & msgSubject & fieldSep & msgSender & fieldSep & msgDate & fieldSep & msgBody & recSep
        end try
    end repeat
end tell
return out
"""


class MailConnector:
    name = "mail"

    def __init__(self, db, memory):
        self.db = db
        self.memory = memory
        self.last_error: str | None = None
        self.synced_total = 0

    def _seen(self) -> set[str]:
        raw = self.db.kv_get("mail_seen_ids", "[]")
        try:
            return set(json.loads(raw))
        except Exception:
            return set()

    def _remember_seen(self, ids: set[str]) -> None:
        # Keep the ledger bounded.
        self.db.kv_set("mail_seen_ids", json.dumps(sorted(ids)[-500:]))

    def sync(self) -> int:
        """Fetch recent inbox mail; ingest unseen messages. Returns count."""
        script = _SCRIPT.format(field=osa.FIELD, record=osa.RECORD,
                                limit=settings.mail_max_messages)
        ok, raw = osa.run(script, timeout=90)
        if not ok:
            self.last_error = raw
            return 0
        self.last_error = None

        seen = self._seen()
        new = 0
        for fields in osa.parse_records(raw):
            if len(fields) < 5:
                continue
            msg_id, subject, sender, date_str, body = fields[:5]
            if not msg_id or msg_id in seen:
                continue
            seen.add(msg_id)
            self.memory.remember(
                f"From: {sender}\nDate: {date_str}\nSubject: {subject}\n\n{body}",
                kind="email",
                source="Mail",
                title=subject or "(no subject)",
                meta={"sender": sender, "date": date_str, "message_id": msg_id},
            )
            new += 1
        if new:
            self._remember_seen(seen)
            self.synced_total += new
        return new
