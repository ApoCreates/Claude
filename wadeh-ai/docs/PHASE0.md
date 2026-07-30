# docs/PHASE0.md — blocking security fixes

**These are live exposures in a public repository right now.** Nothing in
Phase 1 starts until all six are closed and a secret scan is clean.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` closed

Two of the six (1 and 2) are **owner actions** — I cannot rotate a credential I
cannot see, and changing repository visibility is the founder's call with a
consequence documented below. The other four are code changes with diff plans.

---

## 0. Read this before item 2

**Making the repository private will break the current production deployment.**

The wadehAI production deploy (`wadeh-ai.vercel.app`) is built with a clone
trick: the Vercel `installCommand` runs

```
git clone --depth 1 --branch wadehai-standalone https://github.com/ApoCreates/Claude.git /tmp/wadehai && ...
```

That clone is **unauthenticated**, and works only because the repo is public. The
moment the repo goes private, the next production build fails at install.

Do item 2 and this migration together:

- **Option A (recommended):** connect the Vercel project to the repo through the
  Vercel–GitHub integration so builds use the org's credentials, and delete the
  clone trick from `installCommand`.
- **Option B:** keep the clone but authenticate it with a fine-grained,
  read-only deploy token stored as a Vercel environment variable. Never inline a
  token in `installCommand` — it is visible in build logs.

Do not discover this during the outage.

---

## [ ] 1. Rotate every credential — OWNER ACTION

| Credential | Where it is exposed | Action |
|---|---|---|
| `ANTHROPIC_API_KEY` | Environment; endpoint is unauthenticated so it is spendable by anyone (item 3) | Revoke in the Anthropic Console, issue a new key, set it only in Vercel env |
| Gemini API key | Same | Revoke in AI Studio, reissue, Vercel env only |
| Admin password | `lib/admin.ts:9` — unsalted single SHA-256 in a public repo | Choose a new password; see item 6 for the replacement mechanism |

`lib/admin.ts:9` currently reads:

```ts
export const ADMIN_HASH = "096a55bead5c4310fb122347927b33aa97310a12e2c81b69e42ba2158796ece1";
```

An unsalted single-round SHA-256 of a human-chosen password is minutes to crack
with a wordlist. **Treat that password as already public**, and anywhere it was
reused, rotate there too.

Also: run a secret scan over the **full git history**, not just the working
tree. Rotating a key does nothing if the old one is still reachable in an old
commit and was never revoked.

**Exit criteria:** old keys revoked (not merely replaced); new keys present only
in Vercel env; `gitleaks`/`trufflehog` clean over full history.

---

## [ ] 2. Make the repository private and move it to an organisation — OWNER ACTION

Today `ApoCreates/Claude` is **public** (verified: `"private": false`,
`"visibility": "public"`), on a personal account, named `Claude`, and it holds
five unrelated projects plus internal architecture notes — including `BRIEF.md`,
which describes the security holes above.

**Exit criteria:** repo private; owned by an organisation; deployment migrated
per §0; access reviewed.

---

## [ ] 3. Lock `/api/tutor`

**File:** `app/api/tutor/route.ts` (222 lines)

**Current state:** no authentication, no rate limiting, no quota. Verified —
grep for `rateLimit|authenticate|getSession|Authorization` returns **0 matches**.
Anyone can loop this endpoint, burn the Gemini free tier, then spend the
Anthropic budget.

**Diff plan**

1. Add `lib/auth/session.ts` — server-side session read (Supabase Auth or
   Clerk). Returns `{ learnerId, orgId, role } | null`.
2. At the top of `POST`, before parsing the body:
   ```ts
   const session = await getSession(request);
   if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
   ```
3. Add `lib/ratelimit.ts` backed by a durable store (Upstash Redis or a Postgres
   table). Key on `session.learnerId`, not IP — IP is shared across a school.
   Sliding window; return `429` with `Retry-After`.
4. Add a server-enforced **daily quota** in the same store. This is what makes
   the README's "10 tutor questions/day" true; today it is enforced nowhere.
5. Log every rejection with learner id and reason so abuse is visible.

**Exit criteria:** an unauthenticated request gets 401; an authenticated request
over quota gets 429; both are covered by a test.

---

## [ ] 4. Persist the budget guard

**File:** `lib/budget.ts` (88 lines)

**Current state:** spend is a module-level counter. The file's own comment
admits it: *"serverless runs many short-lived instances, so this in-memory
counter is BEST-EFFORT, not a hard ceiling."* Every cold start resets it, so the
real ceiling is whatever the Anthropic Console spend limit is.

**Diff plan**

1. Create table `tutor_spend (period date, org_id text, usd numeric, updated_at timestamptz)`.
2. Replace the module global with a read-modify-write against that table, inside
   a transaction so concurrent instances cannot both pass the cap.
3. Keep `MONTHLY_BUDGET_USD` as config; add per-org budgets for B2B tenants.
4. Keep the Console spend limit as the outer backstop — defence in depth, and
   say so in the comment rather than relying on it.

**Exit criteria:** two concurrent instances cannot exceed the cap; spend
survives a cold start; a per-org report exists.

---

## [ ] 5. Delete the client-side paywall

**Current state:** `plan` is stored in `localStorage` and set by a client
function.

- `lib/prefs.tsx:8` — `export type Plan = "free" | "scholar" | "family"`
- `lib/prefs.tsx:123` — `localStorage.getItem(KEY)`
- `lib/prefs.tsx:143` — `localStorage.setItem(KEY, JSON.stringify(prefs))`
- `lib/prefs.tsx:202` — `setPlan: (plan) => setPrefs(...)`

Anyone can grant themselves Family from the browser console. Every gate below
reads that value and is therefore decorative:

| File | Line | Gate |
|---|---|---|
| `app/learn/[subject]/page.tsx` | 61 | free-tier notice |
| `app/learn/[subject]/[level]/page.tsx` | 43 | `locked = plan === "free" && n > FREE_LEVELS` |
| `app/pricing/page.tsx` | 60, 97 | current-plan display |
| `components/PlacementTest.tsx` | 81 | caps placement result |
| `components/SunSprint.tsx` | 33 | caps sprint range |
| `components/LevelPath.tsx` | 17 | locks levels in the path UI |

**Diff plan**

1. Add `entitlements` to the server session: seats, tenant, allowed grades.
2. Move every gate to a server check. Client `plan` becomes **display only** —
   it may render a lock icon; it may never be the thing that decides access.
3. Lesson content for a locked level must not be sent to the client at all.
   Today a locked level's data still ships in the bundle.
4. Delete `setPlan` from the public context.

**Exit criteria:** editing `localStorage` grants nothing; a locked lesson's
content is absent from the network response, not merely hidden.

---

## [ ] 6. Remove the admin console from the client bundle

**Files:** `app/admin/page.tsx` (243 lines), `lib/admin.ts` (19 lines)

**Current state:** the admin check runs **in the browser**. The hash ships to
every visitor, and the session is:

- `app/admin/page.tsx:28` — `setAuthed(sessionStorage.getItem(SESSION_KEY) === "1")`
- `app/admin/page.tsx:34` — `sessionStorage.setItem(SESSION_KEY, "1")`

Anyone can type that one line in the console and be an admin. The password is
not even the weak link.

**Diff plan**

1. Delete `lib/admin.ts` entirely. Do not port `ADMIN_HASH`.
2. Move admin to a **server route** with a real session and a `role` check
   (`sysadmin` / `org_admin` per the tenancy model).
3. Password hashing, if any local password survives, uses **Argon2id or bcrypt
   with a per-user salt** — never a bare SHA-256.
4. Ensure the admin bundle is not shipped to non-admins.
5. Add an audit log for admin actions.

**Exit criteria:** `sessionStorage` grants nothing; no admin code or hash in the
client bundle; role checked server-side; actions audited.

---

## Release gate

Phase 1 does not begin until:

- [ ] All six items closed
- [ ] Secret scan clean over **full git history**
- [ ] Old credentials **revoked**, not just replaced
- [ ] Production deploy still green after the private-repo migration (§0)
- [ ] The README's "10 tutor questions/day" claim is either enforced or removed
