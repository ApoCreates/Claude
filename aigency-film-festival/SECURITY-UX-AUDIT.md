# Security & UX Audit — The Aigency Film Festival

**Date:** 2026-07-24
**Scope:** `aigency-film-festival/` — Next.js 14 (App Router) submission portal
**Method:** Full static review of all 42 source files, a production build
(`next build`), live black-box testing against `next start`, and responsive
screenshots (1440 px desktop / 390 px mobile) captured with headless Chromium.

This document is an assessment. It records findings and recommended fixes; it
does **not** change application behaviour.

---

## Executive summary

The portal is a well-built, genuinely polished app. The design system is
coherent, the type and colour work is confident, the code is clean and typed,
`tsc --noEmit` and `next build` pass with no errors, and it degrades gracefully
when Supabase/Resend aren't configured. On the defensive side it does several
things right: **no XSS sinks** (all user content flows through React's
auto-escaping or the email `esc()` helper — no `dangerouslySetInnerHTML`
anywhere), **timing-safe** password/token comparison, RLS enabled on both
Supabase tables, and the service-role key is only ever used server-side.

The risk is concentrated in one place: **the unauthenticated public write
surface**. Submissions, votes, and uploads accept anonymous input with no
authentication, no rate limiting, no CAPTCHA, and no moderation gate — and a
submission is published live *and* triggers outbound email immediately. That,
plus a working open redirect and a CSV formula-injection path, are the items
worth fixing before a real, publicly-linked training.

Nothing here is a remote-code-execution or data-breach class bug. These are
abuse-resistance, integrity, and hardening issues appropriate to a public
festival portal.

---

## Security findings (ranked)

### S1 — Unauthenticated, unmoderated public publishing + email relay/bomb — **High**

`POST /api/submissions` requires no auth, no rate limit, and no CAPTCHA. A
submission is **instantly public**: `/films` and `/film/[slug]` render
`listSubmissions()` with no `featured`/status filter, so every anonymous entry
gets its own live page the moment it's posted. Verified live:

```
POST /api/submissions {title:"PWNED-AUDIT-TEST", ...}  → 200, slug returned
GET  /film/pwned-audit-test-or79                        → attacker text is LIVE
```

Two concrete abuse vectors:

1. **Defacement / spam / illicit content.** Anyone can flood the Official
   Selection with arbitrary titles, loglines, crew text, poster images, and
   embedded YouTube videos — with no review step. On a domain like
   `festival.ai-gency.ai` that is a brand-safety problem.
2. **Email relay / bomb.** Each submission fires two Resend emails — one to the
   organiser and one to the **attacker-controlled `submitter_email`**. An
   attacker can set `submitter_email` to any victim and make your verified
   Resend domain send them "You're in the Official Selection" mail on demand.
   That burns your sending reputation and turns the portal into a spam relay.

**Recommend:** add a moderation gate (new submissions default to a
non-public `status` until an admin approves — the `status` field and admin
controls already exist; just have the public pages filter to
approved/featured); rate-limit the endpoint by IP; add a lightweight CAPTCHA
(hCaptcha/Turnstile) on the submit form; and only send the confirmation email
after approval, or throttle per-address.

---

### S2 — Open redirect via the login `next` parameter — **Medium**

`app/api/admin/login/route.ts` only checks `next.startsWith("/")` before doing
`NextResponse.redirect(new URL(next, req.url))`. A protocol-relative value
passes that check and resolves to an external origin. Verified live:

```
POST /api/admin/login  password=aigency  next=//evil.example.com/phish
  → Location: http://evil.example.com/phish
POST /api/admin/login  password=aigency  next=/\/evil.example.com
  → Location: http://evil.example.com/
```

A crafted `/admin?...` link can bounce an admin to an attacker site right after
they authenticate — a clean phishing/credential-harvest hop under the trusted
domain.

**Recommend:** reject values that start with `//` or `/\`, or better, validate
against an allowlist of internal paths (e.g. require it to start with a single
`/` **and not** a second `/` or `\`), or drop the `next` feature entirely and
always redirect to `/admin`.

---

### S3 — Unauthenticated file upload to a public bucket, no type allowlist — **Medium**

*(Latent in demo mode; active once Supabase is configured.)*
`POST /api/upload` has no authentication. It enforces an 8 MB size cap but
**no content-type or extension allowlist**, and it forwards the
attacker-supplied `file.type` as the stored `Content-Type` into a **public**
Supabase bucket with `x-upsert`, then returns the public URL.

Consequences when live: anonymous visitors can host arbitrary files on your
storage domain (malware/phishing hosting, bandwidth abuse), and an uploaded
`.svg`/`.html` served with `image/svg+xml` or `text/html` can execute script
when opened top-level (stored XSS on the storage origin, plus reputational
risk on your domain).

**Recommend:** require the file to be an image (`image/png|jpeg|webp|avif`),
validate magic bytes not just `file.type`, force a safe stored `Content-Type`,
randomise the object name, and gate uploads behind the submission flow (or at
least a rate limit).

---

### S4 — CSV formula injection in the admin export — **Medium**

`app/api/admin/export/route.ts` quotes cells containing `",\n` but does not
neutralise cells that *begin* with `=`, `+`, `-`, or `@`. Fields like `title`,
`logline`, and `crew` are attacker-controlled (S1). A title such as
`=HYPERLINK("http://evil","clickme")` or `=cmd|'/c calc'!A1` becomes a live
formula when the organiser opens the CSV in Excel/Sheets — code execution/data
exfiltration against the person running the jury room.

**Recommend:** in `csvCell`, prefix any value beginning with `= + - @` (or tab/CR)
with a `'` (or wrap so the leading character is quoted-escaped).

---

### S5 — Audience-vote ballot stuffing — **Low/Medium**

`POST /api/vote` has no server-side dedup and no rate limit; the only guard is
client-side `localStorage`. Verified — five raw curls bumped a film 24 → 28:

```
POST /api/vote {id:"demo-3"} ×5  → 24,25,26,27,28
```

The **People's Sun** (Audience Favourite) award is decided by exactly this
counter, so the award is trivially forgeable.

**Recommend:** rate-limit and dedup server-side (IP + film hash / cookie /
signed one-time token), and/or treat the audience vote as advisory for the
award.

---

### S6 — Demo default password is enabled and shown on screen — **Low**

`ADMIN_PASSWORD` defaults to `"aigency"`, and when it's unset the login page
literally prints *"Demo password: aigency"*. If a real deployment forgets to
set `ADMIN_PASSWORD`, the jury room is open to anyone and the site advertises
the key. The `README`/`.env.example` do warn to change it, and the admin banner
nudges "Set ADMIN_PASSWORD", but the failure mode is silent-open, not
fail-closed.

**Recommend:** in `NODE_ENV === "production"`, refuse to run the admin (or
return 503 on `/admin`) when `ADMIN_PASSWORD` is unset, rather than serving the
demo password.

---

### S7 — Missing security headers — **Low**

No `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`,
`X-Content-Type-Options`, `Referrer-Policy`, or HSTS on responses (verified on
`/films`). The site is framable (clickjacking on the vote/submit actions) and
has no defence-in-depth CSP.

**Recommend:** add a `headers()` block in `next.config.js`:
`X-Frame-Options: DENY` (or `frame-ancestors 'none'`),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security`, and a CSP that allows only self +
`youtube-nocookie.com` (frame) + `i.ytimg.com`/Supabase (img) + the fonts host.

---

### S8 — Attacker-controlled `poster_url` rendered in email & pages — **Low**

The submitter can set `poster_url` to any string (≤600 chars) — there's no
`http(s)` validation. It's rendered as `<img src>` on public pages, in the
admin panel, and inside the organiser's HTML email. Not an XSS vector (`img
src` won't run `javascript:`), but it's a tracking-pixel / IP-logging vector
aimed at the organiser and a content-spoofing vector on public pages.

**Recommend:** validate `poster_url` is an `https://` URL (optionally restrict
to allowed hosts) before storing/rendering.

---

### S9 — Auth model notes — **Informational**

- The admin session token is `HMAC(ADMIN_PASSWORD, "aff-admin-v1")` —
  deterministic and **non-expiring**; it only changes when the password
  changes. A leaked token is valid indefinitely (the 7-day cookie is the only
  bound). Consider adding an issued-at/expiry to the signed payload.
- One shared password for all jurors (no per-user identity) — acceptable for a
  small jury, but jury scores can't be attributed and revocation is all-or-none.
- `verifyPassword` compares `Buffer.length` before `timingSafeEqual`, which
  leaks the password length. Minor.

---

### S10 — Google Fonts loaded via `@import` — **Informational / privacy**

`globals.css` `@import`s from `fonts.googleapis.com`. That sends every
visitor's IP/UA to Google and is a render-blocking request. Consider
`next/font` (self-hosting) for privacy and performance.

---

## UI / UX & responsive findings

Overall the responsive behaviour is good: layouts stack cleanly at 390 px,
the header collapses "The Selection" on mobile, grids reflow at sensible
breakpoints, and there is no horizontal overflow. The following are the
concrete issues.

### U1 — Crew "Name" field collapses to ~30 px — **Bug (visible)**

On `/submit`, the first crew row renders the **Name** input as a ~30 px sliver
while **Role** ("Director") takes the whole row — the intended widths are
reversed. Measured live: `Name width = 30px`, `Role width = 595px`.

Root cause: `globals.css` declares `.field { width: 100% }` *after*
`@tailwind utilities`, so it wins (equal specificity, later source order) over
the Tailwind `w-40` on the Role input. The Role input therefore gets a
flex-basis of 100 %, consuming the row, and the `flex-1` Name input (basis 0)
collapses. This affects any `.field` combined with a width utility.

**Recommend (surgical):** lay the row out with a grid instead of fighting the
flex-basis, e.g. `className="grid grid-cols-[1fr_10rem_auto] gap-3"` on the
row and drop `flex-1`/`w-40` from the inputs — `.field { width:100% }` then
correctly fills each track. (Or scope the global rule so width utilities win.)

### U2 — Broken/empty posters with no image fallback — **Robustness**

`posterFor` falls back to the YouTube **`maxresdefault`** thumbnail for the OG
image and `hqdefault` for cards. `maxresdefault` is *not guaranteed to exist*
(the code comment says so) — when it's missing YouTube returns a 404 / grey
placeholder. Worse, `FilmCard`/film page/admin render a plain `<img>` with **no
`onError`**, and the plasma-gradient fallback only triggers when `poster_url`
is `null`, not when the image *fails to load*. Result: films with a valid
YouTube URL but no real poster can show an empty box (as seen in the sandbox
where thumbnails were blocked). OG preview images can likewise 404.

**Recommend:** use `hqdefault` (always present) for posters, and add an
`onError` handler that swaps to the plasma gradient so a failed load never
leaves an empty card.

### U3 — `metadataBase` is `undefined` — **SEO/OG**

`app/layout.tsx` sets `metadataBase: undefined`. Next.js then can't resolve
relative OG image URLs to absolute ones, so social/link-preview images may not
render on some platforms.

**Recommend:** set `metadataBase: new URL(siteUrl())` (the `siteUrl()` helper
already exists in `lib/brand.ts`).

### U4 — No `robots.txt` / `sitemap` — **SEO**

Neither is present. For a public festival you likely want `/films` and film
pages indexed. Add `app/robots.ts` and `app/sitemap.ts`.

### U5 — Accessibility gaps — **Low**

- Animations (`floaty`, `pulse2`, hover transitions) don't honour
  `prefers-reduced-motion`. Add a `@media (prefers-reduced-motion: reduce)`
  block that disables them.
- A lot of micro-copy uses `text-on/40`–`/45` (≈40–45 % of `#F4EFE5` on
  `#15140F`). Several of these fall below the WCAG AA 4.5:1 ratio for small
  text — the mono labels and hints especially. Consider bumping to `/55–/60`.
- Focus states rely mostly on `border-color` changes; a visible focus ring
  (`:focus-visible` outline) would help keyboard users on the dark theme.

### Positives worth keeping

- Privacy-enhanced embeds (`youtube-nocookie`, `loading="lazy"`), correct
  Shorts vs 16:9 aspect handling.
- Strong empty-states ("The selection opens with the first film").
- Clean semantic structure (`<article>`, `<dl>`, `<fieldset>/<legend>`), and
  `aria-label`s on icon-only controls.
- Optimistic voting with graceful fallback; `navigator.share` with clipboard
  fallback.

---

## Suggested priority order

1. **S1** — gate/rate-limit/moderate public submissions + email (highest impact).
2. **S2** — fix the open redirect (one-line validation).
3. **S4** — CSV formula-injection escaping (protects the organiser).
4. **U1** — crew Name field layout bug (visible on the main form).
5. **S3 / S5 / S6** — upload hardening, vote dedup, fail-closed admin password.
6. **S7 / U2 / U3** — headers, poster fallback, `metadataBase`.
7. Remaining low/info items.

---

## What was tested

- `npm run typecheck` → pass · `npm run build` → pass (18 routes).
- Live: open-redirect (confirmed), auth gates on ratings/award/select/export
  (correctly 401/303), vote dedup (absent — confirmed), unmoderated publish
  (confirmed), XSS sinks (none), security headers (absent).
- Screenshots at 1440 px and 390 px for home, films, film, submit, resources,
  admin; focused measurement of the crew-row inputs.
