# docs/DATA-MODEL.md — tenancy, RLS and key handling

Phase 1 infrastructure. Written before any live database exists, so the
migrations have something to be checked against rather than the other way round.

**Scope note.** Phase 1 is infrastructure only. Method engines, lesson
authoring, XR, the rewards redesign and any child-facing visual work are **out
of scope** and must not be started here.

---

## 1. One project, rows and RLS

**One Supabase project for all of wadehAI.** Tenancy is rows plus row-level
security — **never a project per tenant**.

The project is **new and dedicated**. Children's learning records do not share
an instance with Diwan's client content, because a shared instance makes the
DPIA and every school security review far harder to answer: "which rows are
children's data?" must have a structural answer, not a query.

```
Organization (ministry / school group / enterprise)
└── School / Site
    └── Class / Cohort
        └── Learner
```

Roles: `sysadmin` · `org_admin` · `principal` · `teacher` · `learner` ·
`parent` · `observer`

> **Open discrepancy.** The founder referred to "the six roles"; BRIEF.md Part 2
> lists **seven**, as above. Per CLAUDE.md §4a both are recorded and **no cause
> is inferred**. All seven are implemented because BRIEF.md wins on conflict and
> removing a role is cheaper than retrofitting one. Awaiting a decision.

---

## 2. RLS invariants

These hold from the **first migration**. No table lands without a policy.

1. **Every tenant table carries `org_id`.** Denormalised deliberately: a policy
   that needs a join to find the tenant is a policy that will be slow and, worse,
   one that is easy to get subtly wrong. The list of tenant tables is
   `TENANT_TABLES` in `schemas/tenancy.schema.ts`.
2. **RLS is enabled on every table, and every table has at least one policy.**
   A table with RLS enabled and no policy denies everything, which looks like a
   bug and gets "fixed" by disabling RLS. Both conditions are asserted.
3. **Roles are scoped, never global.** A grant is
   `(principal, role, scopeType, scopeId)`. A teacher at one school is not a
   teacher everywhere. `sysadmin` is the sole unscoped role and policies check
   it explicitly rather than letting it fall out of a wildcard.
4. **Read and write are separate policies.** `observer` and `parent` are
   read-only (`READ_ONLY_ROLES`); no write policy names them.
5. **A parent sees only their own children** — `ParentLink` must exist and
   consent must be given and not revoked.
6. **Learner rows are minimal.** `displayName` is a first name or nickname
   chosen by the school. No legal name, no date of birth, no national ID. Richer
   identity stays in the school's SIS.
7. **Deletes are soft where they touch a child's record** (`removedAt`,
   `revokedAt`, `archivedAt`) so that a mis-click is recoverable and an audit can
   still answer "who had access in March".

### The policy shape every tenant table uses

```sql
alter table public.<t> enable row level security;

create policy "<t>_read" on public.<t> for select using (
  public.is_sysadmin()
  or public.has_scope_access(org_id, <school_id-or-null>, <class_id-or-null>)
);

create policy "<t>_write" on public.<t> for insert with check (
  public.is_sysadmin()
  or public.has_write_access(org_id, <school_id-or-null>, <class_id-or-null>)
);
```

`is_sysadmin()`, `has_scope_access()` and `has_write_access()` are
`security definer` functions over `role_grants`, so the scoping logic lives in
one place and the policies stay readable. They mirror `ROLE_SCOPES` and
`READ_ONLY_ROLES` in `schemas/tenancy.schema.ts`; a test asserts the two agree.

---

## 3. Key handling — non-negotiable

| Key | Where it may appear | Where it must never appear |
|---|---|---|
| `anon` | Client bundle, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — |
| `service_role` | Server runtime environment only | **The repo. The client bundle. Any `NEXT_PUBLIC_*` variable.** |

- The `service_role` key **bypasses RLS**. Anything holding it is a full-access
  credential, so it lives only in server-side environment configuration.
- No `service_role` value is committed, ever — not in `.env.example`, not in a
  comment, not in a migration, not in a test fixture.
- A build that references `service_role` from client-reachable code is a release
  blocker, not a warning. `maintenance-steward`'s secret scan checks for it.
- The `anon` key is public by design and is not a secret; it is safe in the
  bundle **because** RLS is enabled everywhere. That is exactly why invariant 2
  is not negotiable — with RLS off, the anon key is a data breach.

---

## 4. Entitlements

Server-side, per organization, seat-based, annual. The client-side `plan`
concept is deleted (Phase 0 item 5).

> The client may render a lock. **The server decides what is sent.** A locked
> lesson's content is absent from the network response, not merely hidden.

`decideAccess()` in `schemas/entitlement.schema.ts` is the single decision
point. It checks **content readiness before commercial terms**, so a lesson that
is not `approved` is never reported as "not licensed" — the honest reason is
that it is not finished.

Denial reasons are a closed enum and are safe to log: they carry no learner
identity.

`nafha` is a first-class entitlement kind, not a discount. AI literacy as a
right is a founder principle, and encoding it as a tier keeps it from being
quietly dropped in a pricing change.

---

## 5. The learning event log

Shape fixed by BRIEF.md Part 1 point 4. Two constraints from safety gate S5:

1. **No PII in events.** Learner id and an opaque, rotating device id only.
   `Evidence` is a closed union — an artifact reference, structured choices, a
   score, or numeric readings. Never raw text a child typed, never inline media.
   `FORBIDDEN_EVENT_FIELDS` plus `findPiiKeys()` reject leaks at the parse
   boundary, and `parseLearningEvent()` is the only sanctioned way in.
2. **Mastery, not minutes.** `LessonProgress.state` is
   `not_started | in_progress | mastered`. Duration is recorded for teacher
   reporting and never as the measure of progress. No streak, no XP, no ranking
   in this layer.

`LessonProgress` is the rollup that answers the Phase 1 acceptance criterion —
a teacher creates a class and sees a learner's real persisted progress —
without aggregating the whole event log on every page load.

---

## 6. What Phase 1 is done when

**A teacher account can create a class and see a learner's real persisted
progress.** Then stop for review.

Checks that must pass at that point:

- [ ] Every table in `TENANT_TABLES` exists, has `org_id`, has RLS enabled, and
      has at least one policy
- [ ] A principal with no grant sees zero rows in every tenant table
- [ ] A teacher scoped to class A cannot read class B, proven by test
- [ ] A parent without a consented `ParentLink` cannot read their child's rows
- [ ] `observer` and `parent` cannot write anything
- [ ] `service_role` appears nowhere in the repo or in any `NEXT_PUBLIC_*`
- [ ] Editing `localStorage` grants no access
- [ ] A `LearningEvent` containing a forbidden field is rejected at parse
- [ ] Progress shown to the teacher comes from persisted rows, not fixtures

---

## 7. Waiting on

**The Supabase project ref.** The founder creates the project; no agent creates
or selects one. Nothing in this document touches a live instance until that ref
arrives — the schemas and this file are deliberately reviewable first.
