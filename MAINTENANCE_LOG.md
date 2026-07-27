# MAINTENANCE_LOG.md

**Append-only.** Never rewrite an entry. `maintenance-steward` adds one block
per `/maintain` run: date, what ran, what was found, what was filed, what
remains.

---

## 2026-07-27 — ledger initialised (no maintenance run yet)

**Ran:** nothing. This entry records the starting position measured during the
first session, so the first real `/maintain` run has a baseline to regress
against.

**Found** (full detail in `docs/AUDIT.md`):

- 0 lessons at `approved`; the status field does not exist in the codebase yet
- 43 hand-authored decks, **57 placeholder lessons rendering in production**
- 93 assessment items against a 12-per-lesson requirement (~8% of minimum)
- 0 misconceptions, 0 engine bindings, 0 standard codes, 0 working engines
- 6 of 6 Phase 0 security items open
- **M2 (placeholder sweep) and M9 (release gate) both fail today**

**Filed:** nothing yet — issue tracker wiring is a Phase 1 deliverable.

**Remains:** Phase 0 in full; founder decisions listed in `docs/PLAN.md`
§Open questions, which block Phase 3 authoring.
