# CLAUDE.md — wadehAI daily working rules

Short rules for every session. **`BRIEF.md` is the permanent full brief; if this
file ever conflicts with it, BRIEF.md wins.** Read BRIEF.md once when onboarding;
read this file every session.

State lives on disk, never in conversation. A crashed or compacted session
resumes by reading `BRIEF.md`, this file, `MAINTENANCE.md`, `docs/PLAN.md` and
the `status` field of the lesson files — never by asking the founder what was
decided.

---

## 1. Definition of Done for a method — all seven, no exceptions

> A learning method does not exist until a child can **DO** it in the browser and
> something changes as a result. A row in an array is not a method. A page that
> describes methods is not a method. An emoji and a sentence is not a method.

A method (engine) is complete only when:

1. **It runs.** An interactive component the learner operates — draws, sings,
   moves, builds, chooses, races, teaches back.
2. **It is content-parameterised.** Takes a `Lesson` record as input. Never
   hardcoded to one topic: the same engine must serve Year 3 fractions and
   Year 9 momentum.
3. **It produces an observable outcome.** A saved drawing, a recorded melody, a
   solved maze, a chosen branch, a measured attempt — something that still
   exists after the child closes the tab.
4. **It writes a learning event.** `{ learnerId, lessonId, engineId, evidence,
   masterySignal, durationMs }`, persisted server-side.
5. **It has a non-sensory fallback.** A deaf child, a blind child, a child with
   no camera, and a child in calm mode can all complete the lesson.
6. **It works in both directions.** Arabic RTL and English LTR, natively
   authored, tested in both.
7. **It has at least one test.** Behaviour, not snapshot.

Scale comes from **depth × reuse**, never from more rows:
**12 engines × 100 lessons = 1,200 playable experiences.**

---

## 2. Lesson status state machine

```
draft ──► authored ──► validated ──► safety-cleared ──► approved
             ▲              │               │                │
             └──────────────┘               │                │
              (validator fail:              │                │
               numbered defects)            ▼                ▼
                                        rejected  ◄──────────┘
                                                          retired
```

| Status | Set by | Means |
|---|---|---|
| `draft` | `curriculum-architect` | Skeleton with real `standards` populated. No body. |
| `authored` | `lesson-author` | Full schema filled, bilingual, natively authored Arabic. |
| `validated` | `pedagogy-validator` | Pedagogy rubric passed. Fail returns it to `authored`. |
| `safety-cleared` | `safety-auditor` | All ten safety gates pass. Any single fail blocks. |
| `approved` | `creative-director` | Creativity gates pass. **Only this status may ship.** |
| `rejected` | any gate | Terminal until deliberately reopened to `authored`. |
| `retired` | `maintenance-steward` | Superseded; kept for provenance, never served. |

**Rules that hold at every transition:**

- Subagents **cannot talk to each other.** Every handoff is a file write plus a
  status transition. The main session is the orchestrator: it reads status,
  picks the next lesson, and dispatches the right subagent with full file paths
  in the prompt.
- Every verdict is appended to `content/reviews/<lessonId>/<agent>.json` —
  **appended, never overwritten.**
- Gate agents are **read-only on content.** They write verdicts, not fixes.
- A safety verdict is **pass/fail per item.** Never an average, never a score
  that hides a failure.
- `standards: []` ⇒ the lesson is `unaligned` and never appears in a B2B tenant.

---

## 3. DO NOT

1. **Do not add rows to a catalog and call it a feature.** The Catalog Trap is
   the defining failure of the last attempt.
2. **Do not write "ask the tutor for a worked example" as lesson content.**
   Delete `autoDeck()`. Placeholder lessons must not render at all.
3. **Do not machine-translate Arabic. Ever.** See §5.
4. **Do not ship any lesson whose `status` is not `approved`.**
5. **Do not build 100 lessons wide** before one subject × six grades is alive.
6. **Do not claim curriculum alignment** without a real code in `standards`.
7. **Do not use `localStorage` for authorization.**
8. **Do not require a headset, camera, or microphone** for any lesson to be
   completable.
9. **Do not design agent-to-agent handoffs.** Route through files and the
   orchestrator.
10. **Do not use the words** "cutting-edge," "revolutionary," or
    "game-changing" in any UI copy, doc, or commit message. Specific outcomes
    and grounded confidence only.
11. **Do not fork the brand.** See §4.

---

## 4. Brand tokens (The Aigency design system)

```
--paper  #F6F1E7      --ink    #1D1A14      --ochre  #C2702A
--dusk   #37465A      --gold   #A8842C
```

Typefaces: **Fraunces** · **IBM Plex Mono** · **Inter** · **Amiri** (Arabic).

**Never pure `#FFF` or `#000`.**

---

## 5. The Arabic native-authoring law

Arabic is authored natively by a **named human author**, recorded in
`provenance.arabicAuthoredBy`. Machine translation is a **hard rejection**, not
a code-review note.

This is a company brand law, not a preference. `pedagogy-validator` must flag
calques and English syntax appearing in Arabic prose, and fail the lesson when
the Arabic reads as translated rather than written.

Practical consequences:

- Arabic and English are peers, not source-and-target. Neither is a translation
  of the other; both say the same thing the way that language says it.
- Every engine is tested in RTL as well as LTR — layout, input, and audio.
- Maths inside Arabic prose stays `dir="ltr"` so equations read correctly.

---

## 6. Where things live

| Path | Contents |
|---|---|
| `BRIEF.md` | Permanent full brief. **Never edit, replace, or delete.** |
| `CLAUDE.md` | This file — daily rules. |
| `MAINTENANCE.md` | Ledger the `maintenance-steward` owns and rewrites. |
| `MAINTENANCE_LOG.md` | Append-only run history. |
| `docs/PHASE0.md` | Blocking security fixes, with diff plans. |
| `docs/AUDIT.md` | Measured inventory of current content. |
| `docs/PLAN.md` | Phase plan with acceptance criteria. |
| `docs/procurement/` | B2B pack: security, DPIA, accessibility, alignment, SLA, offline. |
| `content/` | Lessons, items, standards, reviews — one lesson per file. |
| `schemas/` | zod schemas. The single source of truth for shape. |
| `engines/` | The 12 method engines. Only `experience-engineer` writes here. |
| `.claude/agents/` | The seven subagent definitions. |
| `.claude/commands/` | Slash commands, including `/maintain`. |

**Branch note:** the canonical source is
`claude/wadeh-ai-bilingual-platform-prfqm8`, where this app lives under
`wadeh-ai/`. The branch `wadehai-standalone` is a **generated deploy mirror** of
that subtree at repository root, produced with
`git subtree split --prefix=wadeh-ai`. Author here; the mirror is derived. See
`docs/PLAN.md` §Branch topology before pushing to either.
