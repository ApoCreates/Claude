#!/bin/bash
# PreToolUse (Edit|Write|MultiEdit). Exit 2 = block; the message goes to Claude.
input=$(cat)
file=$(echo "$input" | python3 -c 'import sys,json; t=json.load(sys.stdin).get("tool_input",{}); print(t.get("file_path") or t.get("path") or "")')
[ -z "$file" ] && exit 0
rel="${file#$CLAUDE_PROJECT_DIR/}"

# 1. Protected paths
list="$CLAUDE_PROJECT_DIR/.claude/protected-paths.txt"
if [ -f "$list" ]; then
  while IFS= read -r pat; do
    [[ -z "$pat" || "$pat" == \#* ]] && continue
    if [[ "$rel" == "$pat"* ]]; then
      echo "Blocked: '$rel' is protected (.claude/protected-paths.txt). If the change is required, record it in plan.md and ask the owner to edit it directly." >&2
      exit 2
    fi
  done < "$list"
fi

# 2. Test-file lock during bug-fix sessions (export FIX_MODE=1)
if [ "${FIX_MODE:-0}" = "1" ]; then
  if [[ "$rel" == *.test.* || "$rel" == *.spec.* || "$rel" == *__tests__* ]]; then
    echo "Blocked: FIX_MODE is on. Fix the code, not the test. The pre-existing failing test is the proof the bug is gone." >&2
    exit 2
  fi
fi
exit 0
