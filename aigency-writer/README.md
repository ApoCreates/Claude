# Qalam · قَلَم — The Aigency Bilingual Writer Agent

An Arabic-native **and** English-native master writer agent — two first languages, one craft. Built as a standalone, white-label product ready to be tailored and sold per client.

## What it is

**A task board you delegate to.** The Tasks tab is the agent's dashboard: assign work (title, brief, discipline, language/dialect, priority, due date) and the agent picks it up automatically, writes the deliverable, and files it under *For your review*. Approve it, or send it back with notes — the agent revises against your exact note (previous drafts are kept per task) and the note simultaneously becomes a permanent lesson in its brain.

**Nine expert disciplines** in one agent, each with a specialist brief layered on a shared bilingual persona:

| Mode | What it delivers |
| --- | --- |
| Copywriting | Headlines (3 angles), body copy, CTAs, platform-native social |
| Campaign Builder | Insight → big idea → channel plan → rollout calendar → KPIs |
| Creative Writing | Essays, speeches, poetry (عمودي/تفعيلة/نثر), brand stories |
| Fiction | Loglines to chapters; فصحى narration + dialect dialogue convention |
| Documentary | Treatments, timed VO scripts with [VISUAL] cues, interview guides |
| Screenwriting | Proper screenplay format, TVCs with shot boards, series arcs |
| Prompt Expert | Engineered LLM/image/video prompts + rationale + variations |
| Comedy | Sketches, stand-up, brand humor — regional registers, safe red lines |
| Newsroom | Editor + head of news: wire stories, bulletins, editorial judgment |

**A native Arabic mind with a literary canon.** `lib/ai/canon.ts` carries the transcreation doctrine (literal English→Arabic translation is forbidden; the Arabic is conceived from the idea with Arabic's own expressive logic — التكثيف، التقديم والتأخير، الصورة العربية) plus a per-discipline canon of Arabic masters — from المتنبي، الجاحظ وابن المقفع to محفوظ، درويش، قباني، وحيد حامد، أنيس منصور، الماغوط وهيكل — each distilled into the specific technique the agent channels for that mode.

**Bilingual by design, not by translation.** The agent transcreates: Arabic outputs are born in Arabic (correct hamza, Eastern numerals for Gulf/Mashreq marketing, «» punctuation, dialect discipline across خليجية/سعودية/مصرية/شامية/عراقية/مغاربية), English outputs are born in English. When asked for both, each version is written as an original from the idea.

**Self-aware.** Every deliverable ends with a short "Why this works / لماذا ينجح هذا" note naming the craft choices, and the agent can critique and rewrite its own drafts.

## How it improves itself

Three loops feed one brain (`lib/brain/`):

1. **Daily self-research** — a Vercel Cron hits `/api/agent/research` every morning at 06:00 UTC; the agent web-searches current copywriting/Arabic-content/campaign/newsroom/prompt-craft trends and distills them into actionable insights. Also triggerable from the Brain panel.
2. **Daily practice (Training Gym)** — every day the agent gets a deterministic ~30-minute session: **6 real-life drills, exactly 3 in Arabic and 3 in English, all different disciplines** (the language↔task pairing rotates daily so both languages cover every discipline over the week). You coach each drill — approve or correct — and corrections are distilled into permanent lessons.
3. **Client feedback** — every output in the Studio carries a 👍/👎 + comment control; comments are distilled by Claude into one-line imperative lessons.

All lessons and insights are injected into every future system prompt. **Baking it into the code:** the Brain panel's *Export brain as code* downloads the current brain as `lib/brain/seed.ts` — commit it and the learning ships permanently with the product (runtime memory is in-process; the export is the durable path, with a clean seam to swap in KV/Postgres later).

## Customization per client (the sellable part)

- **Client profiles** (Profiles tab): voice personality, formality and directness sliders, preferred Arabic register/dialect, locked EN⇄AR glossary, always/never red lines, and a voice sample to emulate. The active profile shapes every word.
- **White-label branding**: set `NEXT_PUBLIC_BRAND_NAME` / `NEXT_PUBLIC_BRAND_TAGLINE` to rebrand the whole app for a client deployment.
- **Fully bilingual UI** with one-click English ⇄ العربية toggle and full RTL support.

## Stack

- Next.js 14 (App Router) + React + TypeScript, Tailwind CSS, Lucide icons
- `@anthropic-ai/sdk` — streaming writing, feedback distillation, and web-search-grounded research
- No database: profiles in localStorage, brain in module memory seeded from `lib/brain/seed.ts` (persistence seam documented in `lib/brain/store.ts`)

## Run it

```bash
cd aigency-writer
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for live writing
npm run dev
```

Open http://localhost:3000. Without an API key the app runs in clearly-labeled **Demo mode** (canned bilingual outputs) so the full flow can be shown to a client offline.

## Deploying on Vercel (per client)

1. Create a **new** Vercel project from this repo, **Root Directory** = `aigency-writer`.
2. Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`, `CRON_SECRET`, the `NEXT_PUBLIC_BRAND_*` vars).
3. The daily research cron in `vercel.json` activates automatically; set `CRON_SECRET` to protect the endpoint.

One deployment per client = isolated brain, isolated branding, isolated billing.

## Layout

- `lib/ai/persona.ts` — the layered system prompt (identity → craft laws → mode → client profile → learned lessons → research insights → output contract)
- `lib/ai/modes.ts` — the 9 expert-mode registry (add a mode here, everything follows)
- `lib/training/scenarios.ts` — drill bank + deterministic daily 30-minute plan builder
- `lib/brain/` — types, runtime store, and the baked-in seed memory
- `lib/tasks/` — task types + queue store for the dashboard
- `app/api/` — `tasks` (assign/list, review actions, agent runs), `write` (streaming), `training` (plan + drill runs), `feedback` (lesson distillation), `agent/research` (daily cron), `agent/brain` (inspect/export)
- `components/writer/` — Task board, Studio, Training Gym, Brain, and Profiles panels
