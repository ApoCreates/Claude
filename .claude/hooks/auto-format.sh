#!/bin/bash
# PostToolUse (Edit|Write|MultiEdit). Formats only the changed file. Never blocks.
input=$(cat)
file=$(echo "$input" | python3 -c 'import sys,json; t=json.load(sys.stdin).get("tool_input",{}); print(t.get("file_path") or t.get("path") or "")')
{ [ -z "$file" ] || [ ! -f "$file" ]; } && exit 0
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md)
    cd "$CLAUDE_PROJECT_DIR" || exit 0
    [ -x node_modules/.bin/prettier ] && node_modules/.bin/prettier --write "$file" >/dev/null 2>&1
    case "$file" in *.ts|*.tsx|*.js|*.jsx)
      [ -x node_modules/.bin/eslint ] && node_modules/.bin/eslint --fix "$file" >/dev/null 2>&1 ;;
    esac ;;
esac
exit 0
