# MAINTENANCE.md — the ledger

Owned and rewritten by `maintenance-steward`. Run history is appended to
`MAINTENANCE_LOG.md`, which is never rewritten.

**Initialised:** 27 July 2026 · **Last run:** never · **Next due:** on first
`/maintain` invocation

## How this actually runs

**An agent cannot wake itself.** Something external invokes it. The steward owns
the schedule, the ledger and the decision about what runs next — not the alarm
clock.

The alarm clock is a **weekly GitHub Actions cron** that runs Claude Code
headless (`claude -p`) with `/maintain`, opens issues for defects, and commits
the updated ledger. That workflow does not exist yet — it is a Phase 1
deliverable. Until it does, `/maintain` is run by hand and this ledger says so
rather than implying automation that is not there.

---

## Tasks

| # | Task | Cadence | Last run | Next due | Exit criteria |
|---|---|---|---|---|---|
| M1 | **Coverage report** | Weekly | never | first run | Lessons counted by status; standards covered per authority; engine-binding coverage; orphaned items listed; **placeholder detection returns zero** |
| M2 | **Placeholder sweep** | Weekly | 2026-07-27 | first `/maintain` | **Now passing.** Zero occurrences of "ask the tutor for" in `lib/`, `app/`, `components/`; `autoDeck()` deleted; no lesson renders generated filler. Re-check every run — a regression here is the project's defining failure returning |
| M3 | **i18n parity** | Weekly | never | first run | Every EN string has a natively-authored AR counterpart; zero suspected machine translations; every lesson names a human in `provenance.arabicAuthoredBy` |
| M4 | **Cost report** | Weekly | never | first run | Tutor spend, cache hit rate, free-vs-paid ratio, per-tenant cost; spend persisted (not a module global) |
| M5 | **Flag review** | Weekly | never | first run | Every moderation flag has a named human reviewer and an age; zero unresolved older than 7 days |
| M6 | **Accessibility regression suite** | Weekly | never | first run | WCAG 2.2 AA across engines in **both directions**; calm mode intact; `prefers-reduced-motion` honoured; no flashing |
| M7 | **Dependency + CVE audit, secret scan** | Weekly | never | first run | No high/critical CVEs unactioned; secret scan clean over **full git history** |
| M8 | **Broken asset and link audit** | Monthly | never | first run | Zero missing media; every `sources[].url` resolves |
| M9 | **Release gate** | Every release | never | before first release | **Zero lessons shipping at a status other than `approved`**; zero unaligned lessons in a B2B tenant |

---

## Known state at initialisation

Measured 27 July 2026 — full detail in `docs/AUDIT.md`.

| Signal | Value | Target |
|---|---:|---|
| Lessons at `approved` | **0** | 6 for the pilot |
| Hand-authored decks (raw material) | 43 | — |
| **Placeholder lessons rendering** | **0** (was 57) | 0 ✓ |
| Lessons showing "in authoring" | 57 | falls as lessons are authored |
| Assessment items total | 93 | 72 for the pilot alone |
| Misconceptions declared | 0 | ≥2 per lesson |
| Engine bindings | 0 | ≥3 per lesson |
| Standard codes | 0 | ≥1 per lesson |
| Working engines | 0 | 12 |
| Phase 0 items closed | 0 / 6 | 6 / 6 |

**M2 now passes** — the placeholders were gated and `autoDeck()` deleted on
27 July 2026, before Phase 1, on founder instruction. **M9 still fails**: zero
lessons are `approved`, so no lesson may ship. That is the honest position, and
the first `/maintain` run should lead with it rather than reporting a clean
sheet.

---

## Rules the steward holds itself to

- A check that could not be run is reported as **not run**, never as passing.
- Never average a pass/fail gate into a score.
- Defects become issues, not TODO comments.
- If a number moved the wrong way since the last run, that leads the report.
- `MAINTENANCE_LOG.md` is append-only.
