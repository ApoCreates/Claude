// wadehAI — entitlements.
//
// Entitlements are **server-side, per-organization, seat-based and annual**.
// They replace the client-side `plan` concept entirely (Phase 0 item 5): a
// value in localStorage is not authorization, and any gate that reads one is
// decorative.
//
// The rule this file exists to enforce:
//
//   The client may render a lock. The server decides what is sent.
//
// A locked lesson's content must be absent from the network response, not
// merely hidden in the UI.

import { z } from "zod";
import { Uuid } from "./tenancy.schema";

/**
 * Commercial shape. `pilot` is free and time-boxed; `nafha` is the founder's
 * AI-literacy-as-a-right tier and is the only free public path — it is a
 * principle, not a marketing line, so it is a first-class entitlement kind
 * rather than a discount on something else.
 */
export const EntitlementKind = z.enum(["pilot", "licensed", "nafha"]);
export type EntitlementKind = z.infer<typeof EntitlementKind>;

export const Entitlement = z.object({
  id: Uuid,
  orgId: Uuid,
  kind: EntitlementKind,

  /** Seats purchased. Enforced server-side against active learners. */
  seats: z.number().int().nonnegative(),

  /** Annual term. Access outside the term is denied regardless of seats. */
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),

  /**
   * Subjects and grades this org has bought. Empty arrays mean "all" — but a
   * lesson still ships only if it is `approved` AND aligned (`standards`
   * non-empty), so "all" never means "including unfinished".
   */
  subjects: z.array(z.string()),
  grades: z.array(z.number().int().min(1).max(12)),

  /**
   * B2B tenants never see unaligned lessons. Kept as an explicit flag so a
   * procurement reviewer can see the guarantee rather than infer it.
   */
  requiresAlignedContent: z.literal(true),

  suspendedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})
  .refine((e) => new Date(e.endsAt) > new Date(e.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })
  .refine((e) => (e.kind === "licensed" ? e.seats > 0 : true), {
    message: "a licensed entitlement needs at least one seat",
    path: ["seats"],
  });
export type Entitlement = z.infer<typeof Entitlement>;

/** The question every content request answers before returning anything. */
export const AccessRequest = z.object({
  orgId: Uuid,
  learnerId: Uuid.nullable(),
  subject: z.string(),
  grade: z.number().int().min(1).max(12),
  lessonStatus: z.string(),
  lessonIsAligned: z.boolean(),
});
export type AccessRequest = z.infer<typeof AccessRequest>;

export const AccessDecision = z.object({
  allowed: z.boolean(),
  /** Why, in a form safe to log. Never contains learner identity. */
  reason: z.enum([
    "ok",
    "no_entitlement",
    "entitlement_expired",
    "entitlement_suspended",
    "seats_exceeded",
    "subject_not_licensed",
    "grade_not_licensed",
    "lesson_not_approved",
    "lesson_unaligned",
  ]),
});
export type AccessDecision = z.infer<typeof AccessDecision>;

/**
 * The single decision function. Server-only — importing this into a client
 * component is a review failure, because the answer must be computed where the
 * caller cannot change the inputs.
 *
 * Order matters: content readiness is checked before commercial terms, so a
 * lesson that is not ready is never described as "not licensed".
 */
export function decideAccess(
  req: AccessRequest,
  entitlement: Entitlement | null,
  activeSeats: number,
  now: Date
): AccessDecision {
  // 1. Content readiness. Only `approved` ships — CLAUDE.md DO NOT #4.
  if (req.lessonStatus !== "approved") {
    return { allowed: false, reason: "lesson_not_approved" };
  }
  if (!req.lessonIsAligned) {
    return { allowed: false, reason: "lesson_unaligned" };
  }

  // 2. Commercial terms.
  if (!entitlement) return { allowed: false, reason: "no_entitlement" };
  if (entitlement.suspendedAt) {
    return { allowed: false, reason: "entitlement_suspended" };
  }
  if (now < new Date(entitlement.startsAt) || now > new Date(entitlement.endsAt)) {
    return { allowed: false, reason: "entitlement_expired" };
  }
  if (entitlement.kind === "licensed" && activeSeats > entitlement.seats) {
    return { allowed: false, reason: "seats_exceeded" };
  }
  if (
    entitlement.subjects.length > 0 &&
    !entitlement.subjects.includes(req.subject)
  ) {
    return { allowed: false, reason: "subject_not_licensed" };
  }
  if (
    entitlement.grades.length > 0 &&
    !entitlement.grades.includes(req.grade)
  ) {
    return { allowed: false, reason: "grade_not_licensed" };
  }

  return { allowed: true, reason: "ok" };
}

/**
 * Tutor quota. The README claims "10 tutor questions/day" and today that is
 * enforced by nothing anywhere in the codebase (docs/AUDIT.md §5). This is the
 * shape that makes the claim true — counted per learner per UTC day, in a
 * durable store, never in a module global.
 */
export const TutorQuota = z.object({
  orgId: Uuid,
  learnerId: Uuid,
  /** UTC date, YYYY-MM-DD. */
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});
export type TutorQuota = z.infer<typeof TutorQuota>;

export const DEFAULT_TUTOR_QUOTA_PER_DAY = 10;
