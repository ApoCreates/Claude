// wadehAI — the engine contract.
//
// A method engine is not a row in a catalog. It is a component a child
// operates, parameterised by lesson data, that emits evidence. This file
// defines what every engine must declare about itself and what every engine
// must emit, so the pipeline can check the seven-point Definition of Done
// mechanically rather than on trust.
//
// Each engine additionally owns a zod schema for its OWN `config`, living at
// engines/<engineId>/schema.ts. This file holds what is common to all twelve.

import { z } from "zod";
import { Bi, FamilyKey, Modality } from "./lesson.schema";

/**
 * The seven-point Definition of Done, as data. An engine declares its own
 * status; `experience-engineer` may not mark a point true without the
 * evidence field that backs it.
 */
export const DefinitionOfDone = z.object({
  /** 1. An interactive component the learner operates. */
  runs: z.literal(true),
  /** 2. Takes a Lesson record; not hardcoded to one topic. */
  contentParameterised: z.literal(true),
  /** 3. Produces something that exists after the tab closes. */
  observableOutcome: z.literal(true),
  /** 4. Writes a LearningEvent server-side. */
  writesLearningEvent: z.literal(true),
  /** 5. Deaf, blind, camera-less and calm-mode children can all finish. */
  nonSensoryFallback: z.literal(true),
  /** 6. Arabic RTL and English LTR, natively authored, tested both. */
  bidirectional: z.literal(true),
  /** 7. At least one behavioural test (not a snapshot). */
  behaviouralTest: z.literal(true),
});
export type DefinitionOfDone = z.infer<typeof DefinitionOfDone>;

/** Evidence backing each point, so a claim of "done" is auditable. */
export const DoDEvidence = z.object({
  testFiles: z.array(z.string().min(1)).min(1, "at least one behavioural test"),
  rtlTestFiles: z.array(z.string().min(1)).min(1, "RTL must be tested"),
  fallbackNotes: Bi,
  eventSchemaRef: z.string().min(1),
});

/**
 * What every engine emits when a child completes a run. This is the row that
 * makes a method real — point 4 of the Definition of Done.
 */
export const LearningEvent = z.object({
  learnerId: z.string().min(1),
  lessonId: z.string().min(1),
  engineId: z.string().min(1),
  /** What the child produced or did. Never PII (safety gate S5). */
  evidence: z.unknown(),
  /**
   * A signal about mastery, not a score to show the child. Progress is
   * mastery-based, never time-based.
   */
  masterySignal: z.object({
    attempted: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    /** 0–1 confidence this learner holds the lesson's bigIdea. */
    confidence: z.number().min(0).max(1),
  }),
  durationMs: z.number().int().nonnegative(),
  /** Set when the child ran the lesson without sight/sound/motion. */
  usedFallback: z.enum(["none", "nonVisual", "nonAudio", "noMotion", "calm"]),
  occurredAt: z.string().datetime(),
});
export type LearningEvent = z.infer<typeof LearningEvent>;

/** Sensors are strictly opt-in, on-device, nothing uploaded (safety gate S8). */
export const SensorUse = z.object({
  sensor: z.enum(["camera", "microphone", "motion"]),
  required: z.literal(false), // never required — a lesson must be completable without it
  processedOnDevice: z.literal(true),
  uploadsRawData: z.literal(false),
  childFacingConsent: Bi,
});

/**
 * The manifest every engine ships. `maintenance-steward` reads these to build
 * the engine-binding coverage report.
 */
export const EngineManifest = z.object({
  engineId: z.string().min(1),
  family: FamilyKey,
  name: Bi,
  /** What the child DOES — a verb phrase, not a description of a topic. */
  whatTheChildDoes: Bi,
  modality: z.array(Modality).min(1),
  /** Typical minutes; a lesson's binding may override. */
  typicalMinutes: z.number().positive(),
  artifactKinds: z.array(
    z.enum(["drawing", "recording", "build", "story", "proof", "photo"])
  ),
  sensors: z.array(SensorUse),
  /** Path to this engine's own config schema. */
  configSchemaRef: z.string().min(1),
  definitionOfDone: DefinitionOfDone,
  evidence: DoDEvidence,
})
  .refine((m) => m.sensors.every((s) => s.required === false), {
    message: "no engine may require a sensor",
    path: ["sensors"],
  });

export type EngineManifest = z.infer<typeof EngineManifest>;

/**
 * The twelve families and what each engine must let the child do. Kept here as
 * the checkable contract behind the taxonomy in BRIEF.md Part 1.
 */
export const FAMILY_CONTRACT: Record<z.infer<typeof FamilyKey>, string> = {
  retrieval: "Blank-page recall with real scoring against the lesson's key ideas",
  visual: "Draw the concept on canvas; get feedback on what they drew",
  sound: "Sing/tap a rhythm or melody that encodes the fact; hear it back",
  movement: "Move to answer — device motion, camera pose, or drag-with-body metaphor",
  story: "Play a branching story where the concept is the mechanic, not the decoration",
  play: "A real game loop with stakes, goals, failure and retry",
  teach: "Teach the concept back to an AI younger sibling who asks naive questions",
  reallife: "Solve a problem set in their street, their souq, their weather",
  senses: "Build/assemble something on screen or with household objects (guided)",
  wonder: "A reveal, an illusion, a 'wait, what?' moment that opens the lesson",
  reflect: "Predict → attempt → compare → explain the gap",
  identity: "Keep a made artifact in a personal museum; become 'the physicist'",
};

/** An engine is only complete when all seven points hold. */
export function isEngineDone(m: EngineManifest): boolean {
  const d = m.definitionOfDone;
  return (
    d.runs &&
    d.contentParameterised &&
    d.observableOutcome &&
    d.writesLearningEvent &&
    d.nonSensoryFallback &&
    d.bidirectional &&
    d.behaviouralTest
  );
}
