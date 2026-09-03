---
name: sdlc-loop
description: The AI-native SDLC loop this repo runs on — intent.md → spec.md → plan.md → diff+tests → PR review → incident back to intent. Use whenever starting a new feature, fix, refactor or task in this repo, whenever the user mentions intent, spec, plan, PR, review, incident or "the loop", and before any implementation work to check which artifact stage the work is at.
---
# SDLC loop

Every stage ends by committing an artifact the next stage reads. The chain of
commits is the audit trail.

| Stage | Artifact | Gate |
|---|---|---|
| 1 Plan | `intent/<date>-<slug>.md` | owner accepts (`/intent`) |
| 2 Design | `docs/sdlc/spec-<slug>.md` | owner approves; concerns resolved (`/spec`) |
| 3 Build | `docs/sdlc/plan-<slug>.md` then the diff | plan accepted in plan mode (`/plan-commit`) |
| 4 Test | build/typecheck/lint/test output pasted; `verifier` agent | all green before "done" |
| 5 Deploy | PR with review findings (`REVIEW.md`, `/pr-sweep`) | owner approves; prod gate hook |
| 6 Maintain | incident → `intent/` or one-PR fix (`/incident-to-intent`) | owner triages |

## Rules
- Locate the stage before acting. If asked to implement and no `plan.md`
  exists for the change, say so and offer to run `/plan-commit`.
- Never skip a stage silently. Skipping is the owner's call, recorded in the commit.
- Artifacts are in the owner's words. Correct them; do not rewrite their intent.
- A second identical mistake goes into CLAUDE.md "Things Claude gets wrong".
- The agent that wrote code never approves it.
