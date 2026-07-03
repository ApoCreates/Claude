#!/usr/bin/env bash
# Install (or remove) a LaunchAgent so LocalBird starts automatically at
# login and keeps running in the background.
#   ./install_autostart.sh          install + start
#   ./install_autostart.sh remove   stop + uninstall
set -euo pipefail
cd "$(dirname "$0")"

PLIST="$HOME/Library/LaunchAgents/com.localbird.server.plist"
LABEL="com.localbird.server"
DIR="$(pwd)"
LOGDIR="$HOME/.localbird/logs"

if [ "${1:-}" = "remove" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "LocalBird autostart removed."
  exit 0
fi

if [ ! -d ".venv" ]; then
  echo "Run ./run.sh or ./setup_mac.sh once first (creates the .venv)."; exit 1
fi

mkdir -p "$LOGDIR" "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$DIR/.venv/bin/python</string>
        <string>-m</string>
        <string>localbird.server</string>
    </array>
    <key>WorkingDirectory</key><string>$DIR</string>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>$LOGDIR/localbird.log</string>
    <key>StandardErrorPath</key><string>$LOGDIR/localbird.err.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

cat <<'NOTE'

LocalBird will now start automatically at login and restart if it crashes.
  Dashboard: http://127.0.0.1:8848
  Logs:      ~/.localbird/logs/

IMPORTANT: background permissions now belong to *python* (the .venv binary),
not Terminal. If capture shows "fallback-window-title", add the python
binary shown below to System Settings → Privacy & Security → Accessibility:
NOTE
echo "  $DIR/.venv/bin/python"
