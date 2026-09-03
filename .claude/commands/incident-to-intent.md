Something is broken. Diagnose, then write it back into the loop.

Input (bug report, ticket, log excerpt or Slack message): $ARGUMENTS

1. Reproduce or locate the cause in the codebase. Read-only: do not edit.
2. If a fix fits in one small PR: write the failing test first, commit it,
   then ask me to run `FIX_MODE=1 claude` and apply the fix there.
3. If it is wider than one PR: write `intent/<date>-<slug>.md` in the
   Stage 1 format with the anomaly and evidence, proposed outcome, affected
   systems and open questions. Status: triage.
4. Either way, append a one-line entry to docs/sdlc/LESSONS.md so the next
   investigation can read it.
