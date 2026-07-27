// wadehAI — the lesson schema. This file is the single source of truth for what
// a lesson IS. Code renders; data teaches.
//
// Anything that fails this schema is rejected — there is no "mostly valid"
// lesson. The minimums encoded here (2 misconceptions, 3 engine families,
// 12 assessment items) are the ones BRIEF.md fixes; changing them is a product
// decision, not a refactor.

import { z } from "zod";

/** Bilingual string. Arabic is authored natively — never a translation of `en`. */
export const Bi = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
});
export type Bi = z.infer<typeof Bi>;

/** Lesson lifecycle. Only `approved` may ship. See CLAUDE.md §2. */
export const LessonStatus = z.enum([
  "draft",
  "authored",
  "validated",
  "safety-cleared",
  "approved",
  "rejected",
  "retired",
]);
export type LessonStatus = z.infer<typeof LessonStatus>;

/** The twelve learning families. Keep the taxonomy — implement it. */
export const FamilyKey = z.enum([
  "retrieval",
  "visual",
  "sound",
  "movement",
  "story",
  "play",
  "teach",
  "reallife",
  "senses",
  "wonder",
  "reflect",
  "identity",
]);
export type FamilyKey = z.infer<typeof FamilyKey>;

/** Curriculum authorities we can cite. An invented code is worse than none. */
export const Authority = z.enum(["UAE_MOE", "JO_MOE", "KSA_MOE", "IB", "CAIE"]);
export type Authority = z.infer<typeof Authority>;

export const Standard = z.object({
  authority: Authority,
  grade: z.number().int().min(1).max(12),
  code: z.string().min(1),
  statement: Bi,
});

/** What children actually get wrong, why, and what fixes it. Minimum two. */
export const Misconception = z.object({
  wrong: Bi,
  why: Bi,
  fix: Bi,
});

/** The first thirty seconds — before any explanation. */
export const Hook = z.object({
  engineId: z.string().min(1),
  config: z.unknown(),
  surprise: Bi,
});

/** Narrative continuity across the year. */
export const Arc = z.object({
  characterId: z.string().min(1),
  beat: Bi,
});

export const Modality = z.enum(["see", "hear", "move", "make", "tell"]);

/**
 * One engine binding. `config` is `unknown` here on purpose: each engine owns
 * its own zod schema and validates its own config. See engine.schema.ts.
 */
export const EngineBinding = z.object({
  engineId: z.string().min(1),
  family: FamilyKey,
  config: z.unknown(),
  modality: z.array(Modality).min(1),
  minutes: z.number().positive(),
});

/** What the child KEEPS. */
export const Artifact = z.object({
  kind: z.enum(["drawing", "recording", "build", "story", "proof", "photo"]),
  prompt: Bi,
});

export const Assessment = z.object({
  itemRefs: z.array(z.string().min(1)).min(12, "at least 12 assessment items"),
  masteryRule: z.object({
    correctOf: z.number().int().positive(),
    outOf: z.number().int().positive(),
  }),
}).refine((a) => a.masteryRule.correctOf <= a.masteryRule.outOf, {
  message: "masteryRule.correctOf cannot exceed outOf",
  path: ["masteryRule"],
});

/** Constrains the AI tutor for this lesson. */
export const TutorScope = z.object({
  allowedTopics: z.array(z.string().min(1)).min(1),
  vocabularyBand: z.number().int().min(1).max(12),
  forbiddenSpoilers: z.array(z.string()),
});

export const Media = z.object({
  src: z.string().min(1),
  alt: Bi,
  credit: z.string().min(1),
  license: z.string().min(1),
});

/**
 * `arabicAuthoredBy` MUST name a human. Machine translation is a hard
 * rejection — a company brand law, not a preference.
 */
export const Provenance = z.object({
  authoredBy: z.string().min(1),
  arabicAuthoredBy: z.string().min(1, "must name a human native Arabic author"),
  reviewedBy: z.array(z.string()),
  sources: z.array(
    z.object({ title: z.string().min(1), url: z.string().url().optional() })
  ),
});

/**
 * Accessibility routes. Each must describe a real path through THIS lesson.
 * Generic boilerplate fails `pedagogy-validator` check P8.
 */
export const A11y = z.object({
  calmModeVariant: z.literal(true),
  nonVisualPath: Bi,
  nonAudioPath: Bi,
  noMotionPath: Bi,
});

export const Lesson = z.object({
  id: z.string().regex(/^[a-z0-9-]+\.g(1[0-2]|[1-9])\.[a-z0-9-]+$/,
    "id must look like subject.g9.slug"),
  subject: z.string().min(1),
  grade: z.number().int().min(1).max(12),
  slug: z.string().min(1),
  status: LessonStatus,
  version: z.number().int().positive(),

  // EMPTY = unaligned = cannot ship to B2B tenants.
  standards: z.array(Standard),

  title: Bi,
  bigIdea: Bi,
  misconceptions: z.array(Misconception).min(2, "at least 2 misconceptions"),
  hook: Hook,
  arc: Arc,
  engines: z.array(EngineBinding).min(3, "at least 3 engine bindings"),
  artifact: Artifact,

  /**
   * Minutes the learner spends receiving rather than acting — exposition,
   * reading, watching, listening to explanation. Engine `minutes` are doing
   * minutes; this is everything else.
   *
   * Without this field creativity gate C1 ("≥60% of lesson minutes are the
   * learner acting") is not computable, because the denominator is unknown.
   * Authors must state it honestly: understating it to clear the ratio is a
   * C1 failure in itself, not a rounding choice.
   */
  expositionMinutes: z.number().nonnegative(),

  assessment: Assessment,
  tutorScope: TutorScope,
  media: z.array(Media),
  provenance: Provenance,
  a11y: A11y,
  updatedAt: z.string().datetime(),
})
  // MIN 3 *distinct families*, not merely 3 bindings.
  .refine((l) => new Set(l.engines.map((e) => e.family)).size >= 3, {
    message: "engines must span at least 3 distinct families",
    path: ["engines"],
  })
  // The standards a lesson cites must match the grade it is written for.
  .refine((l) => l.standards.every((s) => s.grade === l.grade), {
    message: "every standard's grade must match the lesson grade",
    path: ["standards"],
  });

export type Lesson = z.infer<typeof Lesson>;

/** A lesson is servable only when approved. Enforced at the release gate. */
export function isShippable(lesson: Lesson): boolean {
  return lesson.status === "approved";
}

/** Unaligned lessons never appear in a B2B tenant. */
export function isAligned(lesson: Lesson): boolean {
  return lesson.standards.length > 0;
}

/**
 * Creativity gate C1: ≥60% of lesson minutes are the learner acting.
 * Computed, not judged — `creative-director` reports the number and fails the
 * gate when it falls below C1_MIN_DOING_RATIO.
 */
export const C1_MIN_DOING_RATIO = 0.6;

export function doingRatio(lesson: Lesson): number {
  const doing = lesson.engines.reduce((sum, e) => sum + e.minutes, 0);
  const total = doing + lesson.expositionMinutes;
  return total === 0 ? 0 : doing / total;
}

export function passesC1(lesson: Lesson): boolean {
  return doingRatio(lesson) >= C1_MIN_DOING_RATIO;
}

/** Creativity gate C2: ≥3 distinct channels across the lesson's engines. */
export function modalityCount(lesson: Lesson): number {
  return new Set(lesson.engines.flatMap((e) => e.modality)).size;
}

/**
 * Phrases that must never appear as lesson content. The first one is the
 * signature of the failure this project is recovering from.
 */
export const FORBIDDEN_CONTENT_PHRASES = [
  "ask the tutor for",
  "cutting-edge",
  "revolutionary",
  "game-changing",
] as const;

export function findForbiddenPhrases(serialisedLesson: string): string[] {
  const hay = serialisedLesson.toLowerCase();
  return FORBIDDEN_CONTENT_PHRASES.filter((p) => hay.includes(p));
}
