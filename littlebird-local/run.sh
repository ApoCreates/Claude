#!/usr/bin/env bash
# LocalBird launcher — sets up a venv on first run, then starts the server.
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3}"
VENV=".venv"

if [ ! -d "$VENV" ]; then
  echo "→ creating virtual environment"
  "$PY" -m venv "$VENV"
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  pip install --upgrade pip >/dev/null
  echo "→ installing core dependencies"
  pip install -r requirements.txt
  echo
  echo "  Core installed. For meetings/native capture run:"
  echo "    source $VENV/bin/activate && pip install -r requirements-optional.txt"
  echo
else
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
fi

exec python -m localbird.server
