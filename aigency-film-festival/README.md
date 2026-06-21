# The Aigency Film Festival

A reusable **submission portal** for AI‑filmmaking trainings, by The Aigency.
Trainees finish a short film, submit it here, and the portal turns their entry
into a **page of its own** — then emails you the moment it lands. Built to be
used in *every* training: change one line per cohort.

> _AI is not the sun. It is what the sun makes possible._

## What it does

- **A glamorous front door** — the slashed‑sun mark, the prize, the Official Selection.
- **Submission flow** — title, logline, YouTube link, duration, poster, crew,
  AI toolchain & disclosure (the Day‑2 checklist, exactly).
- **Dynamic film pages** at `/film/[slug]` — embedded YouTube player (landscape
  **and** vertical Shorts), poster, crew, jury score, audience vote, share.
- **Email on submission** — a designed, on‑brand "film page" email to you, plus a
  confirmation to the trainee (via Resend).
- **Admin / jury room** at `/admin` — submissions, a **rating system**
  (Story · Craft · Use of AI · Emotion), a leaderboard, Official‑Selection
  toggles, award assignment, and CSV export.
- **The prize** — _The Slashed Sun_, inspired by the brand mark.

## Run it now (demo mode — zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment set it runs in **demo mode**:
an in‑memory store seeded with example films, and submission emails are printed
to the server console. Admin password is `aigency`.

> Demo mode is for previews. The in‑memory store is **not durable** on serverless
> (it resets on cold starts). Set up Supabase below before a real training.

## Go live (about 10 minutes)

1. **Database + posters — Supabase** (free)
   - Create a project at [supabase.com](https://supabase.com).
   - SQL Editor → paste [`supabase/schema.sql`](./supabase/schema.sql) → Run.
   - Project Settings → API → copy the **Project URL** and the **service_role** key.
   - Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

2. **Email — Resend** (free)
   - Create an API key at [resend.com](https://resend.com), set `RESEND_API_KEY`.
   - Set `FESTIVAL_NOTIFY_EMAIL` to the address that should receive submissions.
   - Until your domain is verified, keep `FESTIVAL_FROM_EMAIL` as
     `onboarding@resend.dev` (it can send to your own address right away).

3. **Lock the admin** — set `ADMIN_PASSWORD` to something real.

4. **Set the public URL** — `NEXT_PUBLIC_SITE_URL=https://festival.ai-gency.ai`
   so email links are absolute.

Copy `.env.example` → `.env.local` and fill in what you need. Every value is
optional; the app degrades gracefully when something is missing.

## Deploy (Vercel)

Import this folder as its own Vercel project (Framework: Next.js — `vercel.json`
already says so). Add the environment variables above in **Project → Settings →
Environment Variables**, then point a subdomain at it:

```
festival.ai-gency.ai   CNAME   cname.vercel-dns.com
```

(or use Vercel's "Add Domain" flow). Posters and the database live in Supabase,
so the deployment itself stays stateless.

## Reuse it for the next training

Change **one** line — `NEXT_PUBLIC_FESTIVAL_EDITION` — e.g. `"Edition II · 2026"`.
Submissions store their cohort, the admin can filter by it, and the Official
Selection can be browsed per cohort. Nothing else to touch.

## Brand

Everything follows the v.2 brand guide: the wordmark (italic _The_ + Aigency),
the slashed sun, Fraunces / Inter Tight / JetBrains Mono, and the warm palette
(ink `#15140F`, paper `#F4EFE5`, ochre `#C4612A`, gold `#D9A24A`). Tokens live in
`tailwind.config.ts` and `lib/brand.ts`. To drop in an official logo asset later,
replace `components/brandmarks.tsx` (one file) — everything references it.

## Map

```
app/(site)/            public site (header + footer)
  page.tsx             landing — hero, manifesto, the arc, the prize, selection
  films/               the Official Selection (filter by cohort)
  film/[slug]/         a film's own page (player, crew, jury, vote, share)
  submit/              the submission form + success page
app/admin/             jury & admin (login, leaderboard, rating, awards, export)
app/api/               submissions · upload · vote · ratings · admin/*
components/             marks, UI, cards, forms
lib/                   brand · store (supabase|memory) · email · storage · auth
supabase/schema.sql    run once to go live
```
