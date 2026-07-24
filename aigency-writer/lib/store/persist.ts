/**
 * Durable state for the agent — tasks, automations, and the brain.
 *
 * On Vercel, serverless instances are ephemeral: module memory is wiped
 * between invocations, so anything worth keeping must live outside the
 * process. This store uses Vercel Blob (BLOB_READ_WRITE_TOKEN is injected
 * automatically when a Blob store is connected to the project):
 *
 *  - every write creates a NEW versioned blob (qalam/state-<epoch>.json),
 *    because overwritten blobs can serve CDN-stale content for up to a
 *    minute — immutable versions give read-after-write consistency;
 *  - reads list the prefix (metadata is strongly consistent) and fetch
 *    the newest version with cache disabled;
 *  - old versions are pruned, keeping the latest few.
 *
 * Without the token (local dev / fresh clone) it falls back to module
 * memory, which matches the old behavior. Swap this file for KV/Postgres
 * later without touching the stores built on top of it.
 */

import { del, list, put } from "@vercel/blob";
import { SEED_INSIGHTS, SEED_LESSONS } from "../brain/seed";
import type { FeedbackRecord, Insight, Lesson } from "../brain/types";
import type { AgentTask, RecurringTask } from "../tasks/types";

export interface QalamState {
  tasks: AgentTask[];
  recurring: RecurringTask[];
  lessons: Lesson[];
  insights: Insight[];
  feedback: FeedbackRecord[];
  lastResearchAt: string | null;
}

const PREFIX = "qalam/state-";
const KEEP_VERSIONS = 5;

export function defaultState(): QalamState {
  return {
    tasks: [],
    recurring: [],
    lessons: [...SEED_LESSONS],
    insights: [...SEED_INSIGHTS],
    feedback: [],
    lastResearchAt: null,
  };
}

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const g = globalThis as unknown as {
  __qalamState?: QalamState;
  __qalamLock?: Promise<unknown>;
};

/**
 * failClosed=true (mutations): a load ERROR throws so the mutation aborts
 * instead of operating on — and then persisting — a default state over
 * real data. Only a genuinely empty store returns defaults. Fail-open is
 * allowed solely for read paths, where a degraded read harms nothing.
 */
async function loadState(opts?: { failClosed?: boolean }): Promise<QalamState> {
  if (!hasBlob()) {
    if (!g.__qalamState) g.__qalamState = defaultState();
    return g.__qalamState;
  }
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (!blobs.length) return defaultState(); // truly empty store
    const latest = blobs.reduce((a, b) => (a.pathname > b.pathname ? a : b));
    const res = await fetch(latest.downloadUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`state fetch ${res.status}`);
    const data = (await res.json()) as Partial<QalamState>;
    return withSeedMemory({ ...defaultState(), ...data });
  } catch (e) {
    if (opts?.failClosed) {
      throw new Error(`[persist] state load failed — mutation aborted to protect data: ${e}`);
    }
    console.warn("[persist] load failed, serving defaults (read-only):", e);
    return defaultState();
  }
}

/**
 * Baked seed memory ships in code and can grow with new deploys; persisted
 * state predates it. Merge in any seed lessons/insights the stored state
 * doesn't have yet, so coaching baked into seed.ts always reaches the
 * live brain.
 */
function withSeedMemory(state: QalamState): QalamState {
  const lessonIds = new Set(state.lessons.map((l) => l.id));
  const newLessons = SEED_LESSONS.filter((l) => !lessonIds.has(l.id));
  if (newLessons.length) state.lessons = [...newLessons, ...state.lessons];

  const insightIds = new Set(state.insights.map((i) => i.id));
  const newInsights = SEED_INSIGHTS.filter((i) => !insightIds.has(i.id));
  if (newInsights.length) state.insights = [...newInsights, ...state.insights];

  return state;
}

async function saveState(state: QalamState): Promise<void> {
  if (!hasBlob()) {
    g.__qalamState = state;
    return;
  }
  // 14-digit zero-padded epoch keeps lexicographic order == chronological
  const path = `${PREFIX}${Date.now().toString().padStart(14, "0")}.json`;
  await put(path, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const stale = blobs
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .slice(KEEP_VERSIONS)
      .map((b) => b.url);
    if (stale.length) await del(stale);
  } catch {
    // pruning is best-effort
  }
}

/** Read-only snapshot of the current state. */
export async function readState(): Promise<QalamState> {
  return loadState();
}

/**
 * Serialized read-modify-write. Mutate the state object in place inside
 * `fn`; it is persisted afterwards. Writes within one instance are
 * queued to avoid clobbering each other.
 */
export async function mutateState<T>(fn: (s: QalamState) => T | Promise<T>): Promise<T> {
  const prev = g.__qalamLock || Promise.resolve();
  let result!: T;
  const next = prev.then(async () => {
    const s = await loadState({ failClosed: true });
    const tasksBefore = s.tasks.length;
    result = await fn(s);
    // Wipe guard: no legitimate mutation empties a non-empty task board
    // (archiving keeps rows; eviction only trims settled tasks over the
    // cap). Refuse rather than persist a mass erase.
    if (tasksBefore > 0 && s.tasks.length === 0) {
      throw new Error("[persist] refusing to save: mutation would erase all tasks");
    }
    await saveState(s);
  });
  g.__qalamLock = next.catch(() => {});
  await next;
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
