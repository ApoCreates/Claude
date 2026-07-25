# Aigency monorepo — build standards

Each product is a standalone Next.js App Router app in its own directory
(e.g. `aigency-writer/`, `product-studio/`, `aigency-film-festival/`),
deployed as its own Vercel project with **Root Directory** set to that
folder. Exclude new product directories from the root `tsconfig.json`.

## THE AIGENCY DESIGN STANDARD (final approved form — apply to every build)

The house design language follows ai-gency.ai. Reference implementation:
`aigency-writer/` (tailwind.config.ts + app/globals.css).

**Palette** — cream paper background `#FBF7EE`, white `#FFFFFF` cards, warm
ink text (darkest `#1C1812`), sun-orange accent `#F26B1F` (readable text
variant `#C4500E`), warm-tan borders (`#E5DCC6` / `#D3C6A8`). Never a dark
theme unless a surface (like the footer logo band) specifically needs it.

**Type** — Playfair Display (serif) for headings, Inter for body,
JetBrains Mono for labels/numbers (mono uppercase "section labels" like
`/ SPEND`), Anton for display; Arabic pairs: Noto Naskh (body/serif),
Noto Kufi (display). Loaded via Google Fonts `<link>` in the root layout.

**Buttons & controls — the core rule:** every actionable control is a
**RECTANGLE** (`rounded-md`, never a pill/`rounded-full`), carries a
**2px ink border**, and casts a **solid offset shadow** behind it
(`4px 4px 0 0 #1C1812`; larger surfaces 8px). Pressing translates the
element into its own shadow (`active:translate-x/y-[3px] active:shadow-none`).
Implemented as `.btn-primary` (orange) and `.btn-secondary` (white) in
`globals.css` — use those classes, don't restyle ad hoc. Tabs are the same
rectangles: active = orange fill + ink border + solid shadow. Labels,
badges, and status indicators are rectangular chips (`rounded-md`), not
pills. Only truly round things (dots, avatars, progress bars) stay round.

**Logo** — the Aigency sun sphere mark (`public/aigency-mark.png`) in the
header + favicon; the full lockup (`public/aigency-lockup.png`, cream
wordmark) only on dark ink bands (footer).

**Language** — every user-facing string ships in English AND
natively-authored Arabic (no machine translation), full RTL support.

## Diwan platform rules (all agents)

Every agent build includes from day one: 1–5★ Arabic-native feedback
capture, structured JSON run logs (no silent failures), weekly pg_cron
pattern detection → improvement tickets, a human review queue for 1–2★
outputs (4 resolution actions, all logged), hash-versioned prompts +
runtime prompt patches (no retraining), multi-tenant client configs with
RLS, and a metrics dashboard. Dashboards must work out of the box on the
local ledger and upgrade when Supabase is connected — never greet the
operator with an error. Automation drafts, humans approve.

## Engineering rules

- Cost metering: every model call is priced from real usage via
  `lib/costs.ts` + persisted spend ledger; show a pre-flight estimate
  next to any button that spends money.
- Web-search research is HARD-CAPPED monthly (default $5, env
  `QALAM_RESEARCH_BUDGET_USD`), enforced from the ledger before every
  run, and runs on the cheap utility model — never on the writing model.
- Persistence is fail-closed: a storage read error must abort a mutation,
  never silently persist defaults over real data (see
  `aigency-writer/lib/store/persist.ts`).
- On serverless, flush logs/ledger writes BEFORE the response closes
  (hold streams open until the final write settles).
- Never commit secrets or model identifiers to the repo.
