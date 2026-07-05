/**
 * Runtime brain store — lessons, insights, and feedback the agent picks up
 * while running. Seeded from lib/brain/seed.ts (the baked-in memory) and
 * held in module memory, which suits the demo and single-instance deploys.
 *
 * Persistence seam: replace the three arrays with Vercel KV / Supabase /
 * Postgres calls and everything else (prompt builder, API, UI) keeps
 * working unchanged. The "Export brain as code" flow in the UI writes
 * runtime learnings back into seed.ts so they survive redeploys today.
 */

import { SEED_INSIGHTS, SEED_LESSONS } from "./seed";
import type { FeedbackRecord, Insight, Lesson } from "./types";

const MAX_RUNTIME_LESSONS = 60;
const MAX_RUNTIME_INSIGHTS = 40;
const MAX_FEEDBACK = 200;

interface BrainState {
  lessons: Lesson[];
  insights: Insight[];
  feedback: FeedbackRecord[];
  lastResearchAt: string | null;
}

// Survive Next.js dev-server module reloads
const globalBrain = globalThis as unknown as { __qalamBrain?: BrainState };

function state(): BrainState {
  if (!globalBrain.__qalamBrain) {
    globalBrain.__qalamBrain = {
      lessons: [...SEED_LESSONS],
      insights: [...SEED_INSIGHTS],
      feedback: [],
      lastResearchAt: null,
    };
  }
  return globalBrain.__qalamBrain;
}

export function getLessons(): Lesson[] {
  return state().lessons;
}

export function getInsights(): Insight[] {
  return state().insights;
}

export function getFeedback(): FeedbackRecord[] {
  return state().feedback;
}

export function getLastResearchAt(): string | null {
  return state().lastResearchAt;
}

export function addLesson(lesson: Omit<Lesson, "id" | "date">): Lesson {
  const s = state();
  const full: Lesson = {
    ...lesson,
    id: `l-${Math.random().toString(36).slice(2, 10)}`,
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
}

export function addInsights(items: Omit<Insight, "id">[]): Insight[] {
  const s = state();
  const added = items.map((i) => ({
    ...i,
    id: `i-${Math.random().toString(36).slice(2, 10)}`,
  }));
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
}

export function addFeedback(rec: Omit<FeedbackRecord, "id" | "date">): FeedbackRecord {
  const s = state();
  const full: FeedbackRecord = {
    ...rec,
    id: `f-${Math.random().toString(36).slice(2, 10)}`,
    date: new Date().toISOString(),
  };
  s.feedback.push(full);
  if (s.feedback.length > MAX_FEEDBACK) s.feedback.splice(0, s.feedback.length - MAX_FEEDBACK);
  return full;
}

/**
 * Render the runtime brain as the contents of lib/brain/seed.ts so learned
 * lessons can be committed — feedback literally baked into the code.
 */
export function exportBrainAsCode(): string {
  const s = state();
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
