# Review instructions

## Passes
Run three passes and tag each finding with its pass:
- **Bugs**: logic errors, broken edge cases, async/race issues, i18n/RTL regressions
- **Security**: apply `.claude/skills/secure-supabase-api` — RLS, key exposure, PII in logs, unvalidated input
- **Compliance**: the diff matches `docs/sdlc/plan-<slug>.md` and `spec-<slug>.md`; brand standards respected in UI

## What Important means here
Reserve **Important** for findings that would break behaviour, leak data,
expose a key, or depart from the committed plan without updating it.
Style and naming are **Nits**.

## Cap the nits
At most five nits per review; summarise the rest as a count.

## Do not report
`supabase/migrations/`, `src/gen/`, lockfiles, and anything lint/typecheck already enforces.

## Feed back
If a finding is the second time this mistake has been flagged, propose the
one-line addition to CLAUDE.md "Things Claude gets wrong" in the review.
