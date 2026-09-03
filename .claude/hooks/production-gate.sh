#!/bin/bash
# PreToolUse (Bash). Production actions require a named release authorization.
cmd=$(python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("command") or "")')
[ -z "$cmd" ] && exit 0
is_prod=0
[[ "$cmd" == *"vercel"* && "$cmd" == *"--prod"* ]] && is_prod=1
[[ "$cmd" == *"supabase db push"* ]] && is_prod=1
[[ "$cmd" == *"supabase db reset"* ]] && is_prod=1
[[ "$cmd" == *"git push"* && ( "$cmd" == *" main"* || "$cmd" == *":main"* ) ]] && is_prod=1
[[ "$cmd" == *"git push"* && "$cmd" == *"--force"* ]] && is_prod=1
if [ "$is_prod" = "1" ] && [ -z "$RELEASE_APPROVAL" ]; then
  echo "Blocked: this touches production or main. Open a PR instead. If the owner has authorized this release, set RELEASE_APPROVAL=<name/date> in the shell before starting the session." >&2
  exit 2
fi
exit 0
