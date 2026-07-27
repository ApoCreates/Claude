---
description: Run the maintenance items that are due, update the ledger, and file defects.
---

Run wadehAI's due maintenance. You are acting as the orchestrator; dispatch the
`maintenance-steward` subagent for the work and report its findings.

## Procedure

1. **Read the ledger.** Open `MAINTENANCE.md`. Determine which tasks are due by
   comparing `next due` against today's date. If `$ARGUMENTS` names a specific
   task, run that one regardless of due date.

2. **Run each due task** via the `maintenance-steward` subagent, one dispatch
   per task, passing the full file paths it needs. Subagents cannot talk to each
   other — everything they hand back comes to you.

3. **Coverage report** — always runs, regardless of schedule:
   - Count lesson files by `status` (`draft` / `authored` / `validated` /
     `safety-cleared` / `approved` / `rejected` / `retired`)
   - Standards covered per authority; list uncovered codes
   - Engine-binding coverage: how many lessons bind ≥3 families
   - Orphaned items in `content/items/` referenced by no lesson
   - **Placeholder detection**: any lesson containing generated filler text, and
     specifically any occurrence of "ask the tutor for"

4. **Release gate** — if the run is pre-release, enumerate every lesson whose
   `status` is not `approved` and stop the release, naming them.

5. **File defects as issues**, not TODO comments. One issue per defect, with the
   file path and the check that failed.

6. **Update the ledger.** Rewrite `MAINTENANCE.md` with new `last run` and
   `next due` values. **Append** a run entry to `MAINTENANCE_LOG.md` — never
   rewrite that file.

7. **Report to the founder** in the session: what ran, what was found, what was
   filed, what remains. Lead with any regression since the last run.

## Rules

- A check you could not run is reported as **not run**, never as passing.
- Never average a pass/fail gate into a score.
- Do not fix product defects during a maintenance run unless they are trivial
  and you say so — the run's job is to find and file, so the ledger stays an
  honest picture of state.
