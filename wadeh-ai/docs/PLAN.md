# docs/PLAN.md — phase plan and acceptance criteria

Source of truth for scope is `BRIEF.md`. This file turns its build order into
acceptance criteria a future session can check without asking the founder
anything.

**Phase 3 is the milestone that matters.** Everything before it is scaffolding;
everything after it is repetition.

---

## Branch topology — read before pushing

| Branch | Role |
|---|---|
| `claude/wadeh-ai-bilingual-platform-prfqm8` | **Canonical source.** This app lives under `wadeh-ai/`. Author here. |
| `wadehai-standalone` | **Generated deploy mirror** — the `wadeh-ai/` subtree at repository root. Production builds clone this branch. |
| `main` | Untouched by this work. |

The mirror is produced, not edited:

```bash
git subtree split --prefix=wadeh-ai -b <tmp>
TREE=$(git rev-parse <tmp>^{tree})
COMMIT=$(git commit-tree "$TREE" -p origin/wadehai-standalone -m "…")
git branch -f wadehai-standalone "$COMMIT"     # fast-forward, never force-push
```

Committing on top of the existing mirror head keeps it a fast-forward and
preserves history. **`BRIEF.md` must exist in `wadeh-ai/` on the canonical
branch**, or the next split deletes it from the mirror.

---

## Phase 0 — blocking security fixes

Detail and diff plans: `docs/PHASE0.md`.

**Done when:** all six items closed; secret scan clean over full git history;
old credentials revoked not merely replaced; production deploy still green after
the private-repo migration; the README's "10 tutor questions/day" claim either
enforced server-side or removed.

**Owner actions inside this phase:** credential rotation and repository
visibility. An agent cannot do either. Note the deploy consequence in
`docs/PHASE0.md` §0 before flipping visibility.

---

## Phase 1 — foundations

Zod schemas, Postgres/Supabase, auth, tenancy, roles, server entitlements,
event log.

```
Organization (ministry / school group / enterprise)
└── School / Site
    └── Class / Cohort
        └── Learner
Roles: sysadmin · org_admin · principal · teacher · learner · parent · observer
```

**Acceptance criteria**

- [ ] A teacher account can create a class and see a learner's **real persisted
      progress** — the brief's own bar
- [ ] `schemas/lesson.schema.ts` and `schemas/engine.schema.ts` are enforced at
      every write; an invalid lesson cannot be committed
- [ ] Entitlements are server-side; editing `localStorage` grants nothing
- [ ] `LearningEvent` rows persist and carry no PII (safety gate S5)
- [ ] SSO path proven for at least one school (SAML or Microsoft Entra)
- [ ] Data residency: UAE region, documented in `docs/procurement/security.md`
- [ ] `content/` directory structure exists and is the only place content lives

---

## Phase 2 — the twelve method engines

**Acceptance criteria**

- [ ] All 12 pass the **seven-point Definition of Done**, each with an
      `EngineManifest` whose `evidence` block names real test files
- [ ] Each engine has its own zod config schema at `engines/<id>/schema.ts`
- [ ] Each engine is tested in **RTL and LTR**
- [ ] No engine requires a camera, microphone, motion sensor or headset
- [ ] Calm mode is a first-class path through every engine, not a degraded one
- [ ] `lib/methods.ts` is deleted or demoted to
      `docs/research/learning-science.md` as the citation notes it actually is

**Build engine 7 (Talk & Teach) first.** The protégé effect is one of the
strongest findings in learning science and the tutor API already exists — invert
it so the child teaches and the AI plays the confused younger learner.

---

## Phase 3 — the vertical slice (**the milestone that matters**)

One subject × grades 4–9 = **six lessons**, standards-mapped, through all four
gates.

**Acceptance criteria**

- [ ] **A real teacher can run a real 40-minute class from it**
- [ ] All six lessons at `status: "approved"` — every gate passed, verdicts on
      disk under `content/reviews/`
- [ ] Every lesson carries ≥1 real standard code from a named authority
- [ ] ≥12 assessment items per lesson (72 total), distractors mapped to named
      misconceptions
- [ ] ≥3 distinct engine families bound per lesson
- [ ] Every lesson has a keepable artifact and three real a11y paths
- [ ] Arabic natively authored by a **named human** in
      `provenance.arabicAuthoredBy` for all six
- [ ] `creative-director` has answered "what does the child actually DO in the
      first minute?" in writing for each, and the answer is not "reads"

**Do not build 100 lessons wide.** Replicate only after a teacher has taught
from it.

---

## Phase 4 — dashboards and the procurement pack

**Teacher dashboard** — the thing that gets renewed:

- [ ] Class mastery heatmap **by standard**, not by XP
- [ ] Per-standard gap list with one-click intervention (assign engine X to
      these six learners)
- [ ] Time-on-task and engagement, honestly reported
- [ ] Printable / exportable class report

**Admin dashboard:**

- [ ] Adoption by school, cohort outcomes, standards coverage
- [ ] CSV/PDF export formatted for ministry reporting

**Procurement pack in `docs/procurement/`:** `security.md`, `dpia.md`,
`accessibility.md`, `alignment/<authority>.md`, `sla.md`, `offline.md`.

**Done when:** a ministry procurement officer can answer their checklist from
the repository without asking a question.

---

## Phase 5 — XR as progressive enhancement

- [ ] `react-three-fiber` + `@react-three/xr`, feature-detected via `navigator.xr`
- [ ] **No lesson requires a headset.** Screen parity is mandatory and tested
- [ ] Exactly **three** flagship XR experiences, not thirty
- [ ] Quest 3 browser first — hand tracking plus passthrough, no app-store review
- [ ] **Identical learning outcome on a plain screen**, demonstrated
- [ ] Headset-maker minimum ages respected; session time limits; seated-only
      mode; no rapid motion

Native/Unity only after a funded pilot asks for it.

---

## Phase 6 — replicate across subjects

- [ ] Coverage report green: every shipped lesson `approved`, every standard
      claimed has a real code, zero placeholder text anywhere
- [ ] `maintenance-steward` release gate passes with no overrides

---

## Rewards model (applies from Phase 1 onward)

Replaces XP + streaks. Decided in `BRIEF.md` Part 9 — recorded here so no future
session re-opens it:

- Mastery-based, never time-based
- The child's own artifacts are the collectibles — a personal museum, not badges
- A class-level collective goal, regionally rooted (build the souq, restore the
  mosaic, bring water through the falaj)
- Teacher-grantable recognition for things only a human would notice
- Streaks are warm, never punitive: "welcome back, here's where you were"
- **No public leaderboards by default in B2B tenants**; opt-in per class
- Calm mode removes all timers, combos and animations and stays first-class

---

## Decisions recorded this session

1. **Artifacts live under `wadeh-ai/`** on the canonical branch, not at the
   monorepo root. The root is shared with four unrelated projects
   (`aigency-film-festival`, `product-studio`, `roblox-vfx-forge`,
   `wayout-quest`); a root-level `CLAUDE.md` would apply wadehAI's rules to all
   of them.
2. **`BRIEF.md` is deduplicated to one canonical copy at `wadeh-ai/BRIEF.md`**
   (md5 `995c0760a12586fb52a37f1a5ac6304f`, byte-identical to what the founder
   uploaded). Two non-copies point at it:
   - the **monorepo root** `/BRIEF.md` is a short pointer, because the root
     holds five unrelated projects and a session told to "read BRIEF.md at the
     repo root" found nothing and stalled;
   - the **`wadehai-standalone` root** copy is not a second original at all — the
     mirror is `wadeh-ai/` projected by `git subtree split`, so it reproduces
     the canonical file automatically. **Editing it there is silently destroyed
     by the next split.**
3. **`zod@^3.25.76` was added** as a dependency. `tsconfig.json` includes
   `**/*.ts`, so `schemas/*.ts` is type-checked by `next build`; without zod
   installed the build breaks. This is the only dependency change of the
   session and no product code was written.
4. **`expositionMinutes` was added to the lesson schema.** BRIEF.md's creativity
   gate C1 requires "≥60% of lesson minutes are the learner acting", but with
   only engine `minutes` recorded the denominator is unknown and the ratio is
   always 1. The new field is the non-doing half. Authors state it honestly;
   understating it to clear the ratio is itself a C1 failure.
5. **Measured content counts differ from BRIEF.md** — 43 hand-authored /
   57 placeholder, not 44 / 56. Founder confirms 43 is correct. **The cause of
   the discrepancy is unknown**; an earlier claim that the brief predated recent
   commits was inference and has been withdrawn. See `docs/AUDIT.md` §1 and
   CLAUDE.md §4a.
6. **Making the repo private will break production.** The deploy clones the
   public repo unauthenticated. See `docs/PHASE0.md` §0 before flipping it.
7. **The 57 placeholder lessons are gated, and `autoDeck()` is deleted**
   (founder instruction, before Phase 1). `buildDeck()` now returns `null` for
   any lesson without a hand-authored deck; `StudyNotebook` renders an honest
   "in authoring / قيد التأليف" panel, `TakeawaySheet` hides itself rather than
   printing filler, and `LevelPath` badges the level before a learner clicks in.
   Verified: 43 render, 57 gate, zero leaks, and the phrase "ask the tutor for"
   no longer appears anywhere in `lib/`, `app/` or `components/`.
8. **`methodsCard()` survives on borrowed time.** It renders six rows from
   `lib/methods.ts` as emoji + name + one sentence — the Catalog Trap itself. It
   is now commented as such and is deleted in Phase 2 with the rest of
   `lib/methods.ts`. It was not removed now because the instruction was to gate
   the placeholders, and removing it is a separate, larger change.

---

## Phase 3 decisions — settled by the founder, 27 July 2026

These are answers, not proposals. Do not re-open them.

### Subject: **AI, grades 4–9**

Not physics. **The choice is driven by the mandated curriculum and the published
core areas, not by which subject has the most existing decks.** The 43
hand-authored decks do not qualify as lessons under the schema anyway — none
carries standards, misconceptions, engine bindings, an artifact, tutorScope,
provenance or a11y paths — so "raw material available" was never a valid
selection criterion. My earlier recommendation of physics used it and was wrong
on that basis.

### Authority: **UAE MoE**

- **Arabic statements are canonical. English is the translation.** This inverts
  the usual direction and it matters: when the two readings differ, the Arabic
  governs. `curriculum-architect` records the Arabic `statement.ar` from the
  official document and treats `statement.en` as derived.
- **Do not proceed on press summaries of the seven core areas.** Secondary
  reporting is not a framework. `curriculum-architect` is **blocked** from
  emitting drafts for this subject until the official framework document is in
  hand.
- **The founder is sourcing the document.** Until it arrives, no AI-subject
  lesson may be created, and no standard code may be written down from any other
  source.

### `arabicAuthoredBy`: **Abdullah Abudiak**

- **Agents draft English only.** The founder writes every Arabic field.
- **Never draft Arabic for approval** — not as a placeholder, not as a starting
  point, not "for reference". See CLAUDE.md §5.
- Consequence encoded in the schema: Arabic fields may be empty while a lesson
  is `draft` or `authored`, and must be non-empty from `validated` onward. A
  lesson therefore cannot pass the pedagogy gate until Abdullah has written its
  Arabic.

### Safety gate S6 (cultural and religious appropriateness): **pending-reviewer**

- `safety-auditor` marks S6 `pending-reviewer` rather than failing it, and may
  still issue `safety-cleared`.
- **S6 blocks only at `approved`.** `creative-director` may not set `approved`
  while S6 is `pending-reviewer`.
- Named per-market reviewers are still required before any lesson ships; this
  changes when the block bites, not whether it exists.

---

## Open questions for the founder

1. **Who are the named per-market cultural reviewers** for GCC and Levant? Not
   blocking until the `approved` gate, per the S6 decision above — but the first
   lesson cannot reach `approved` without them.
