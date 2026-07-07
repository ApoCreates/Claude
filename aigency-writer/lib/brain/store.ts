/**
 * The agent's brain — lessons, insights, and feedback — persisted via
 * lib/store/persist.ts (Vercel Blob in production, module memory locally)
 * and seeded from lib/brain/seed.ts, the baked-in memory that ships with
 * the code. "Export brain as code" writes runtime learnings back into
 * seed.ts format so proven lessons survive in git forever.
 */

import { mutateState, newId, readState } from "../store/persist";
import { SEED_INSIGHTS, SEED_LESSONS } from "./seed";
import type { FeedbackRecord, Insight, Lesson } from "./types";

const MAX_RUNTIME_LESSONS = 60;
const MAX_RUNTIME_INSIGHTS = 40;
const MAX_FEEDBACK = 200;

export interface BrainSnapshot {
  lessons: Lesson[];
  insights: Insight[];
  feedback: FeedbackRecord[];
  lastResearchAt: string | null;
}

export async function getBrain(): Promise<BrainSnapshot> {
  const s = await readState();
  return {
    lessons: s.lessons,
    insights: s.insights,
    feedback: s.feedback,
    lastResearchAt: s.lastResearchAt,
  };
}

export async function addLesson(lesson: Omit<Lesson, "id" | "date">): Promise<Lesson> {
  return mutateState((s) => {
    const full: Lesson = {
      ...lesson,
      id: newId("l"),
      date: new Date().toISOString().slice(0, 10),
    };
    s.lessons.push(full);
    // Cap runtime growth but never evict the baked-in seed lessons
    const seedIds = new Set(SEED_LESSONS.map((l) => l.id));
    const runtime = s.lessons.filter((l) => !seedIds.has(l.id));
    if (runtime.length > MAX_RUNTIME_LESSONS) {
      const evict = new Set(
        runtime.slice(0, runtime.length - MAX_RUNTIME_LESSONS).map((l) => l.id)
      );
      s.lessons = s.lessons.filter((l) => !evict.has(l.id));
    }
    return full;
  });
}

export async function addInsights(items: Omit<Insight, "id">[]): Promise<Insight[]> {
  return mutateState((s) => {
    const added = items.map((i) => ({ ...i, id: newId("i") }));
    s.insights.push(...added);
    const seedIds = new Set(SEED_INSIGHTS.map((i) => i.id));
    const runtime = s.insights.filter((i) => !seedIds.has(i.id));
    if (runtime.length > MAX_RUNTIME_INSIGHTS) {
      const evict = new Set(
        runtime.slice(0, runtime.length - MAX_RUNTIME_INSIGHTS).map((i) => i.id)
      );
      s.insights = s.insights.filter((i) => !evict.has(i.id));
    }
    s.lastResearchAt = new Date().toISOString();
    return added;
  });
}

export async function addFeedback(
  rec: Omit<FeedbackRecord, "id" | "date">
): Promise<FeedbackRecord> {
  return mutateState((s) => {
    const full: FeedbackRecord = {
      ...rec,
      id: newId("f"),
      date: new Date().toISOString(),
    };
    s.feedback.push(full);
    if (s.feedback.length > MAX_FEEDBACK) {
      s.feedback.splice(0, s.feedback.length - MAX_FEEDBACK);
    }
    return full;
  });
}

/**
 * Render the runtime brain as the contents of lib/brain/seed.ts so learned
 * lessons can be committed — feedback literally baked into the code.
 */
export async function exportBrainAsCode(): Promise<string> {
  const s = await readState();
  const ser = (v: unknown) => JSON.stringify(v, null, 2).replace(/^/gm, "  ").trimStart();
  return `/**
 * ── THE BAKED BRAIN ──────────────────────────────────────────────────────
 * Exported from the running agent on ${new Date().toISOString().slice(0, 10)}.
 * Commit this file to make every learned lesson permanent.
 */

import type { Insight, Lesson } from "./types";

export const SEED_LESSONS: Lesson[] = ${ser(s.lessons)};

export const SEED_INSIGHTS: Insight[] = ${ser(s.insights)};
`;
}
