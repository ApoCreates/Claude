#!/usr/bin/env bash
# The Aigency — QC gate 1 (source check), runnable.
# Implements the greps in the brand skill's references/04-qc-gates.md so the
# review desk checks rather than assumes.
#
#   .claude/scripts/qc-gates.sh <file-or-dir>...
#
# Exit 0 = clean. Exit 1 = at least one hard failure. Warnings never fail the run.
#
# Scope: this checks artefacts — the things the studio ships. A line containing the
# marker `qc-allow` is exempt from every check, for the cases where naming a forbidden
# pattern is the point: rule documents, test fixtures, and the quoted SEO copy that is
# allowed to say Dubai.

set -uo pipefail

targets=("$@")
[ ${#targets[@]} -eq 0 ] && targets=(".")

fails=0
warns=0

# Only text artefacts; never walk node_modules or binaries.
collect() {
  find "${targets[@]}" \
    \( -name node_modules -o -name .git -o -name .next -o -name dist -o -name build \) -prune -o \
    -type f \( -name '*.html' -o -name '*.css' -o -name '*.md' -o -name '*.js' -o -name '*.mjs' \
            -o -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.svg' -o -name '*.txt' \) \
    -print 2>/dev/null
}

mapfile -t FILES < <(collect)
if [ ${#FILES[@]} -eq 0 ]; then
  echo "qc-gates: no text artefacts found under: ${targets[*]}"
  exit 0
fi

check() {           # check <severity> <label> <grep-args...>
  local sev="$1" label="$2"; shift 2
  local hits
  hits=$(grep -nE "$@" "${FILES[@]}" 2>/dev/null | grep -v 'qc-allow')
  if [ -n "$hits" ]; then
    if [ "$sev" = fail ]; then
      printf '\n  FAIL  %s\n' "$label"; fails=$((fails+1))
    else
      printf '\n  WARN  %s\n' "$label"; warns=$((warns+1))
    fi
    printf '%s\n' "$hits" | sed 's/^/        /' | head -20
  fi
}

echo "The Aigency · QC gate 1 — source check"
echo "Files: ${#FILES[@]}"

# 1 · Colour. Tokens only; never pure black or white.
check fail "pure black or white — use --ink / --paper tokens" -i \
  '#fff\b|#ffffff\b|#000\b|#000000\b|rgb\(255, ?255, ?255\)|rgb\(0, ?0, ?0\)'

# 2 · Naming. One spelling, one styling.
check fail "wrong spelling of The Aigency" \
  'AIgency|AI-gency|The AI Agency|TheAigency\b|THE AIGENCY'
check fail "lowercase 'the aigency' in running text" \
  '(^|[^@/[:alnum:]-])the aigency([^-./[:alnum:]]|$)'

# 3 · Domain and handle.
check fail "malformed domain — it is written ai-gency.ai" -i \
  '[^-]aigency\.ai|www\.ai-gency|ai-gency\.com|theaigency\.ai|https?://ai-gency'

# 4 · Place. Abu Dhabi in mastheads, footers, addresses.
check warn "Dubai — check this is quoted SEO copy, not designed material" -i \
  '\bDubai\b'

# 5 · Voice.
check fail "forbidden vocabulary" -i \
  'leverage|synergy|unlock|disrupt|world-class|best-in-class|industry-leading|cutting-edge|actionable|deliverables|bandwidth|game-?changer|seamless|revolutionary'

# 6 · Register. "Apo" never appears in formal material.
formal=$(printf '%s\n' "${FILES[@]}" | grep -iE 'proposal|tender|deck|profile|certificate|invoice|contract' || true)
if [ -n "$formal" ]; then
  hits=$(printf '%s\n' "$formal" | xargs grep -nE '\bApo\b' 2>/dev/null || true)
  if [ -n "$hits" ]; then
    printf '\n  FAIL  "Apo" in formal material — use Abdullah Abudiak\n'
    fails=$((fails+1)); printf '%s\n' "$hits" | sed 's/^/        /' | head -20
  fi
fi

# 7 · Accent on ground. Ochre fails contrast on ink or night.
for f in "${FILES[@]}"; do
  if grep -qiE 'C4612A' "$f" 2>/dev/null && grep -qiE '1A0408|15140F|--night|--ink\b' "$f" 2>/dev/null; then
    printf '\n  WARN  %s — ochre and a dark ground in one file; ochre on ink or night fails contrast (use gold or marigold)\n' "$f"
    warns=$((warns+1))
  fi
done

# 8 · Export safety. SVG sun marks die in print engines.
check warn "SVG mark in a file that may be export-bound — use the PNG marks" -i \
  'sun\.svg|sun-lockup-[a-z]+\.svg|wordmark-[a-z]+\.svg'

echo
if [ $fails -gt 0 ]; then
  echo "gate 1: $fails failing check(s), $warns warning(s) — not ready"
  exit 1
fi
echo "gate 1: clean${warns:+ · $warns warning(s)}"
