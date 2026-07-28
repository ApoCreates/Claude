// wadehAI — the learning event log.
//
// This is point 4 of the seven-point Definition of Done: an engine is not a
// method until it **writes a learning event**, server-side. The event is the
// evidence that something happened; without it, an "interactive" component is
// a toy.
//
// Two hard constraints, both from safety gate S5:
//
//   1. **No PII in events.** Learner id and device id only. Never a name,
//      never an email, never free text a child typed.
//   2. **Mastery, not minutes.** Progress reflects what is understood. Time is
//      recorded for teacher reporting, never as the measure of progress.

import { z } from "zod";
import { Uuid } from "./tenancy.schema";

/**
 * What the child produced. Deliberately constrained: an engine may record a
 * reference to an artifact, a score, or a structured choice — but not raw text
 * or media inline, because that is where PII leaks in.
 *
 * A drawing lives in storage; the event carries its id.
 */
export const Evidence = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("artifact"),
    artifactId: Uuid,
    artifactKind: z.enum(["drawing", "recording", "build", "story", "proof", "photo"]),
  }),
  z.object({
    kind: z.literal("choices"),
    /** Indices or stable option ids — never the option text. */
    selected: z.array(z.string().max(64)),
  }),
  z.object({
    kind: z.literal("scored"),
    correct: z.number().int().nonnegative(),
    attempted: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("measured"),
    /**
     * Engine-defined numeric readings, e.g. a recorded tempo or a distance.
     *
     * The keys are arbitrary, which makes this the one place a careless engine
     * could smuggle identity in — `readings: { dob: 2015 }` is well-typed. The
     * key name is therefore constrained and the PII sweep in
     * `parseLearningEvent` runs over the raw input, before zod strips anything.
     */
    readings: z.record(
      z.string().max(40).regex(/^[a-z][a-z0-9_]*$/, "reading keys are snake_case"),
      z.number().finite()
    ),
  }),
  z.object({
    kind: z.literal("none"),
  }),
]);
export type Evidence = z.infer<typeof Evidence>;

/**
 * A signal about mastery — never a score shown to the child, and never a
 * ranking. `confidence` is the system's belief that this learner holds the
 * lesson's bigIdea.
 */
export const MasterySignal = z.object({
  attempted: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
})
  .refine((m) => m.correct <= m.attempted, {
    message: "correct cannot exceed attempted",
    path: ["correct"],
  });
export type MasterySignal = z.infer<typeof MasterySignal>;

/** Which non-sensory path the child actually used, if any. */
export const FallbackUsed = z.enum([
  "none",
  "nonVisual",
  "nonAudio",
  "noMotion",
  "calm",
]);
export type FallbackUsed = z.infer<typeof FallbackUsed>;

/**
 * The row every engine writes. Shape fixed by BRIEF.md Part 1 point 4:
 * `{ learnerId, lessonId, engineId, evidence, masterySignal, durationMs }`,
 * plus the tenancy and audit columns the platform needs around it.
 */
export const LearningEvent = z.object({
  id: Uuid,
  orgId: Uuid,        // denormalised for RLS
  schoolId: Uuid,
  classId: Uuid.nullable(),   // null when a learner works outside a class

  learnerId: Uuid,
  lessonId: z.string().min(1),
  engineId: z.string().min(1),

  evidence: Evidence,
  masterySignal: MasterySignal,
  durationMs: z.number().int().nonnegative(),
  usedFallback: FallbackUsed,

  /** Opaque, rotating, not a fingerprint. Used for abuse limits only. */
  deviceId: z.string().max(64).nullable(),

  occurredAt: z.string().datetime(),
  recordedAt: z.string().datetime(),
});
export type LearningEvent = z.infer<typeof LearningEvent>;

/**
 * Rolled-up progress per learner per lesson. Derived from events, stored so a
 * teacher dashboard does not aggregate the whole log on every page load.
 *
 * This is the table that answers the Phase 1 acceptance criterion: a teacher
 * creates a class and sees a learner's **real persisted progress**.
 */
export const LessonProgress = z.object({
  id: Uuid,
  orgId: Uuid,
  schoolId: Uuid,
  learnerId: Uuid,
  lessonId: z.string().min(1),

  /** Mastery-based, never time-based. */
  state: z.enum(["not_started", "in_progress", "mastered"]),
  confidence: z.number().min(0).max(1),

  enginesCompleted: z.array(z.string().min(1)),
  totalDurationMs: z.number().int().nonnegative(),

  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  masteredAt: z.string().datetime().nullable(),
});
export type LessonProgress = z.infer<typeof LessonProgress>;

/**
 * Field names that must never appear in an event payload. Checked in tests and
 * by `maintenance-steward`, so a future engine cannot quietly start logging a
 * child's name because it seemed useful at the time.
 */
export const FORBIDDEN_EVENT_FIELDS = [
  "name",
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "dob",
  "dateOfBirth",
  "nationalId",
  "photo",
  "freeText",
  "transcript",
] as const;

/** Returns any forbidden key found anywhere in an event payload. */
export function findPiiKeys(payload: unknown, path: string[] = []): string[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((v, i) => findPiiKeys(v, [...path, String(i)]));
  }
  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, unknown>).flatMap(([k, v]) =>
      (FORBIDDEN_EVENT_FIELDS as readonly string[]).includes(k)
        ? [[...path, k].join(".")]
        : findPiiKeys(v, [...path, k])
    );
  }
  return [];
}

/**
 * Parse-and-check helper. The **only** sanctioned way to admit an event.
 *
 * The PII sweep runs over the **raw input first**, deliberately. zod strips
 * unknown keys rather than rejecting them, so checking only the parsed result
 * would silently discard a leaked `email` and report success — we would never
 * learn that something tried to send it. An attempt to write PII is a signal
 * worth failing loudly on, not a field to quietly drop.
 *
 * The parsed result is swept too, because `Evidence.measured.readings` has
 * caller-defined keys that survive parsing.
 */
export function parseLearningEvent(input: unknown): LearningEvent {
  const rawLeaks = findPiiKeys(input);
  if (rawLeaks.length > 0) {
    throw new Error(
      `learning event payload contains forbidden PII field(s): ${rawLeaks.join(", ")}`
    );
  }
  const event = LearningEvent.parse(input);
  const leaks = findPiiKeys(event);
  if (leaks.length > 0) {
    throw new Error(
      `learning event contains forbidden PII field(s): ${leaks.join(", ")}`
    );
  }
  return event;
}
