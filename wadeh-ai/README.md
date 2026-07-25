# wadehAI · واضح — Learn clearly

A bilingual (Arabic / English) AI learning platform for the Arab world, built for two regions — **the GCC** and **the Levant** — where the learner must choose a region and language *before entering*. Every lesson, example, and price then adapts to that choice.

Design language derives from **The Aigency design system v.3**: paper on ink at 70/20/10, ochre accent, Fraunces + Inter Tight + JetBrains Mono (Amiri + IBM Plex Sans Arabic for Arabic), the slashed-sun mark (rendered here as a *rising* +22° cut to distinguish the product from the studio), mono eyebrows, cut lines, roman numerals. Never `#FFF`, never `#000`, no glows, no shadows on type.

## Product

- **The gate** (`/`) — language (EN/AR) and region (GCC/Levant) are chosen before entry; the whole app switches direction (RTL/LTR), fonts, examples and pricing accordingly.
- **Curriculum** (`/learn`) — 10 subjects × 10 levels, where **one level = one school year** (Year 1 → Year 10, ages ~6 to ~16). Every level carries a written year focus and four units, authored in both languages (`lib/levels/*.ts`):
  - *From education:* Mathematics, Physics, Geography, Artificial Intelligence, Game Design
  - *From real life:* Entrepreneurship, Leadership, Problem Solving, Emotional Intelligence, Learning Languages
- **The learning loop** (Duolingo mechanics, set in daylight):
  - **Level path** — a winding ladder of ten suns per subject; passing a year's mastery quiz lights the next sun (sequential unlock).
  - **Mastery quizzes** — 5 fresh questions per run (math and upper physics are procedurally generated, so they never repeat), immediate feedback with explanations, pass at 4/5.
  - **Rays (XP), daily streaks and daily quests** — answer 10 correctly, master a year, ask the tutor 3 questions; each quest pays bonus Rays.
  - **Spaced review queue** — missed questions come back inside future quizzes until beaten.
- **Visual labs** (`TRY IT LIVE`) — interactive, per-year: number-line addition, fraction bars and a live function grapher for math; a float-or-sink density tank and an animated projectile launcher for physics.
- **AI tutor in every lesson** — patient, Socratic, bilingual, age-calibrated to the school year, and able to **draw real graphs** in its answers via `PLOT` directives rendered by the client. Live Claude API when `ANTHROPIC_API_KEY` is set; graceful canned mode otherwise.
- **Subscription** (`/pricing`) — region-aware pricing:
  | Plan | GCC | Levant | Unlocks |
  |---|---|---|---|
  | Explorer | Free | Free | Levels I–II of every subject, 10 tutor questions/day |
  | Scholar | AED 49/mo | USD 9/mo | All 100 levels, unlimited tutor, certificates |
  | Family | AED 89/mo | USD 16/mo | Scholar × 4 learner profiles + family dashboard |

  Levant pricing is set for regional purchasing power. Plan state is currently client-side (demo); the checkout seam is `setPlan()` in `lib/prefs.tsx` — swap it for Stripe (GCC), Tap / HyperPay (KSA/UAE cards + Mada), or a telco-billing provider for the Levant, plus a real auth + entitlements backend.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · `@anthropic-ai/sdk`. No database — progress and plan live in `localStorage` for the demo; `lib/prefs.tsx` is the seam for a real backend.

## Run it

```bash
cd wadeh-ai
npm install
cp .env.example .env.local   # optional — add ANTHROPIC_API_KEY for the live tutor
npm run dev                  # http://localhost:3001
```

Deployable to Vercel as its own project (root directory: `wadeh-ai/`).

## Path to market

1. **Now (this repo):** full clickable product — gate, curriculum, paywall, tutor, bilingual RTL/LTR.
2. **Pilot:** add auth (Clerk/Supabase), Stripe + Tap checkout, move progress/entitlements server-side, author full lesson bodies for 2 subjects × 10 levels with regional curriculum reviewers.
3. **Launch:** remaining 8 subjects, parent reports, school (B2B) tier, Arabic dialect-aware tutor voice, iOS/Android wrappers.
