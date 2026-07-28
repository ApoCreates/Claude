// wadehAI — tenancy and roles.
//
// One Supabase project for all of wadehAI. Tenancy is **rows + RLS**, never a
// project per tenant. Every row that can be read by a request carries the
// org_id it belongs to, and every table has an RLS policy from its first
// migration — no table lands without one.
//
//   Organization (ministry / school group / enterprise)
//   └── School / Site
//       └── Class / Cohort
//           └── Learner
//
// Nothing here is child-facing. This file describes shape only; the policies
// themselves live in the migrations and are documented in docs/DATA-MODEL.md.

import { z } from "zod";

export const Uuid = z.string().uuid();

/**
 * The seven roles from BRIEF.md Part 2.
 *
 * NOTE — unresolved discrepancy: the founder referred to "the six roles" while
 * BRIEF.md lists seven. Per CLAUDE.md §4a both are recorded and **no cause is
 * inferred**. All seven are implemented because BRIEF.md wins on conflict, and
 * removing a role later is cheaper than retrofitting one. Flagged for decision.
 */
export const Role = z.enum([
  "sysadmin",   // wadehAI staff. Cross-org. The only role not scoped to a tenant.
  "org_admin",  // ministry / group administrator
  "principal",  // school leader
  "teacher",    // teaches one or more classes
  "learner",    // the child
  "parent",     // guardian of one or more learners
  "observer",   // read-only: inspector, researcher, procurement reviewer
]);
export type Role = z.infer<typeof Role>;

/**
 * Roles are **scoped**, never global. A teacher at one school is not a teacher
 * everywhere, and RLS depends on this: a policy asks "does this principal hold
 * a role whose scope contains the row's org/school/class?"
 */
export const ScopeType = z.enum(["organization", "school", "class"]);
export type ScopeType = z.infer<typeof ScopeType>;

/** Which scope levels each role may be granted at. Enforced by `RoleGrant`. */
export const ROLE_SCOPES: Record<Role, ScopeType[]> = {
  sysadmin: [],                          // unscoped by design — see note below
  org_admin: ["organization"],
  principal: ["school"],
  teacher: ["school", "class"],
  learner: ["class"],
  parent: ["organization", "school"],    // linked to learners via ParentLink
  observer: ["organization", "school"],
};

/**
 * `sysadmin` is deliberately unscoped and must therefore be rare, audited, and
 * never granted to a customer. RLS policies check it explicitly rather than
 * treating it as "a role that happens to match every scope".
 */
export const SYSADMIN_IS_UNSCOPED = true;

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const Organization = z.object({
  id: Uuid,
  name: z.string().min(1),
  /** Stable short code used in reporting and procurement documents. */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["ministry", "school_group", "enterprise", "pilot"]),
  /** ISO 3166-1 alpha-2. Drives which curriculum authorities are selectable. */
  country: z.string().length(2),
  /** Data residency is a procurement commitment, so it is recorded per org. */
  dataRegion: z.literal("uae"),
  createdAt: z.string().datetime(),
});
export type Organization = z.infer<typeof Organization>;

export const School = z.object({
  id: Uuid,
  orgId: Uuid,
  name: z.string().min(1),
  /** Emirate / governorate — used for per-market cultural review (gate S6). */
  region: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
});
export type School = z.infer<typeof School>;

export const Class = z.object({
  id: Uuid,
  orgId: Uuid,        // denormalised for RLS: policies must not need a join
  schoolId: Uuid,
  name: z.string().min(1),
  /** Real school grade, 1–12. Never the invented "Year 1–10" ladder. */
  grade: z.number().int().min(1).max(12),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  archivedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Class = z.infer<typeof Class>;

/**
 * A learner. **Minimal PII by design** (safety gate S5).
 *
 * `displayName` is a first name or a nickname chosen by the school — never a
 * full legal name, never a date of birth, never a national ID. Anything richer
 * belongs in the school's own SIS, not here. `externalRef` is an opaque school
 * identifier so a school can reconcile without giving us identity data.
 */
export const Learner = z.object({
  id: Uuid,
  orgId: Uuid,
  schoolId: Uuid,
  displayName: z.string().min(1).max(60),
  externalRef: z.string().max(120).nullable(),
  /** Grade the learner is actually in — may differ from a class's grade. */
  grade: z.number().int().min(1).max(12),
  /** Calm mode and the non-sensory paths are learner-level, not device-level. */
  accessibility: z.object({
    calmMode: z.boolean(),
    reducedMotion: z.boolean(),
    nonVisual: z.boolean(),
    nonAudio: z.boolean(),
  }),
  createdAt: z.string().datetime(),
});
export type Learner = z.infer<typeof Learner>;

/** Class membership. A learner may sit in more than one class. */
export const ClassEnrolment = z.object({
  id: Uuid,
  orgId: Uuid,
  classId: Uuid,
  learnerId: Uuid,
  enrolledAt: z.string().datetime(),
  removedAt: z.string().datetime().nullable(),
});
export type ClassEnrolment = z.infer<typeof ClassEnrolment>;

/**
 * A person who can sign in. Deliberately **not** called "user" — `principal`
 * is the security term, and it keeps the word "user" free for prose.
 * Authentication is Supabase Auth; `authUserId` is the join to `auth.users`.
 */
export const Principal = z.object({
  id: Uuid,
  authUserId: Uuid,
  email: z.string().email(),
  displayName: z.string().min(1),
  createdAt: z.string().datetime(),
  disabledAt: z.string().datetime().nullable(),
});
export type Principal = z.infer<typeof Principal>;

/** A role held by a principal at a scope. The unit RLS actually reads. */
export const RoleGrant = z.object({
  id: Uuid,
  principalId: Uuid,
  role: Role,
  scopeType: ScopeType.nullable(),   // null only for sysadmin
  scopeId: Uuid.nullable(),          // null only for sysadmin
  /** Denormalised for RLS. Null only for sysadmin. */
  orgId: Uuid.nullable(),
  grantedBy: Uuid.nullable(),
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
})
  .refine(
    (g) =>
      g.role === "sysadmin"
        ? g.scopeType === null && g.scopeId === null && g.orgId === null
        : g.scopeType !== null && g.scopeId !== null && g.orgId !== null,
    { message: "sysadmin must be unscoped; every other role must be scoped" }
  )
  .refine(
    (g) => g.role === "sysadmin" || ROLE_SCOPES[g.role].includes(g.scopeType!),
    { message: "role cannot be granted at that scope level" }
  );
export type RoleGrant = z.infer<typeof RoleGrant>;

/**
 * A learner is a child, not an account holder, so `learner` grants point at a
 * Learner row rather than carrying identity. Parents link separately.
 */
export const LearnerAccount = z.object({
  id: Uuid,
  orgId: Uuid,
  learnerId: Uuid,
  principalId: Uuid,
});
export type LearnerAccount = z.infer<typeof LearnerAccount>;

/** Guardian relationship. Parental consent is recorded, not assumed. */
export const ParentLink = z.object({
  id: Uuid,
  orgId: Uuid,
  principalId: Uuid,
  learnerId: Uuid,
  /** PDPL: consent is per learner, timestamped, and revocable. */
  consent: z.object({
    givenAt: z.string().datetime().nullable(),
    revokedAt: z.string().datetime().nullable(),
    method: z.enum(["school_verified", "email_confirmed", "paper"]),
  }),
});
export type ParentLink = z.infer<typeof ParentLink>;

// ---------------------------------------------------------------------------
// Helpers used by server code and mirrored by the RLS policies
// ---------------------------------------------------------------------------

/** Roles that may read a learner's progress. Parents also need a ParentLink. */
export const CAN_READ_LEARNER_PROGRESS: Role[] = [
  "sysadmin",
  "org_admin",
  "principal",
  "teacher",
  "parent",
  "observer",
  "learner",
];

/** Roles that may never write learning data, only read it. */
export const READ_ONLY_ROLES: Role[] = ["observer", "parent"];

/** Every tenant-scoped table must carry this column. Asserted in migration tests. */
export const TENANT_COLUMN = "org_id" as const;

/**
 * Tables that hold tenant rows. `maintenance-steward` cross-checks this list
 * against the live schema so a new table cannot quietly ship without RLS.
 */
export const TENANT_TABLES = [
  "schools",
  "classes",
  "learners",
  "class_enrolments",
  "role_grants",
  "learner_accounts",
  "parent_links",
  "entitlements",
  "learning_events",
  "lesson_progress",
] as const;
