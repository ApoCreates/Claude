#!/usr/bin/env bash
# One-time macOS setup for the full local experience:
#   - Homebrew deps (Ollama for local models)
#   - Python venv + all optional dependencies
#   - Pulls sensible default local models
# After this, use ./run.sh to launch.
set -euo pipefail
cd "$(dirname "$0")"

echo "== LocalBird macOS setup =="

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found. Install from https://brew.sh first."; exit 1
fi

# --- Ollama (local LLM + embeddings) ---
if ! command -v ollama >/dev/null 2>&1; then
  echo "→ installing Ollama"
  brew install ollama || brew install --cask ollama
fi
echo "→ starting Ollama service"
brew services start ollama 2>/dev/null || (ollama serve >/dev/null 2>&1 &)
sleep 3

echo "→ pulling local models (chat + embeddings)"
ollama pull llama3.1 || echo "  (you can pull a smaller model, e.g. 'ollama pull llama3.2:3b')"
ollama pull nomic-embed-text

# --- Python env ---
PY="${PYTHON:-python3}"
if [ ! -d ".venv" ]; then
  "$PY" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip >/dev/null
echo "→ installing Python dependencies (core + optional)"
pip install -r requirements.txt
pip install -r requirements-optional.txt || \
  echo "  Some optional deps failed (whisper/pyobjc). Core still works."

cat <<'NOTE'

== Setup complete ==

Grant Accessibility permission so LocalBird can read active-window text:
  System Settings → Privacy & Security → Accessibility → enable your terminal
  (and Screen Recording / Microphone if you want meeting capture).

Launch:
  ./run.sh                     # web dashboard at http://127.0.0.1:8848
  python -m menubar.app        # optional menu bar control

NOTE
