/**
 * Task queue + recurring automations, persisted via lib/store/persist.ts
 * (Vercel Blob in production, module memory locally). Tasks are the unit
 * of delegation — you assign, the agent executes, you review.
 */

import { mutateState, newId, readState } from "../store/persist";
import type { AgentTask, RecurringTask, TaskStatus } from "./types";

const MAX_TASKS = 200;

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

function sortTasks(tasks: AgentTask[]): AgentTask[] {
  return [...tasks].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function listTasks(): Promise<{
  tasks: AgentTask[];
  recurring: RecurringTask[];
  stats: Record<TaskStatus, number>;
}> {
  const s = await readState();
  const stats: Record<TaskStatus, number> = {
    queued: 0,
    running: 0,
    review: 0,
    approved: 0,
    archived: 0,
  };
  for (const t of s.tasks) stats[t.status]++;
  return { tasks: sortTasks(s.tasks), recurring: s.recurring, stats };
}

export async function getTask(id: string): Promise<AgentTask | undefined> {
  const s = await readState();
  return s.tasks.find((t) => t.id === id);
}

export async function createTask(
  input: Omit<AgentTask, "id" | "status" | "createdAt" | "updatedAt" | "drafts"> & {
    status?: TaskStatus;
  }
): Promise<AgentTask> {
  return mutateState((s) => {
    const now = new Date().toISOString();
    const task: AgentTask = {
      drafts: [],
      ...input,
      id: newId("t"),
      status: input.status || "queued",
      createdAt: now,
      updatedAt: now,
    };
    s.tasks.push(task);
    if (s.tasks.length > MAX_TASKS) {
      // Evict oldest settled tasks first; never evict active work
      const settled = s.tasks.filter((t) => t.status === "archived" || t.status === "approved");
      const evict = new Set(settled.slice(0, s.tasks.length - MAX_TASKS).map((t) => t.id));
      s.tasks = s.tasks.filter((t) => !evict.has(t.id));
    }
    return task;
  });
}

export async function updateTask(
  id: string,
  patch: Partial<AgentTask>
): Promise<AgentTask | undefined> {
  return mutateState((s) => {
    const task = s.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    return task;
  });
}

/** Move the current result into drafts (with the coach note) before a rerun. */
export async function pushDraft(
  id: string,
  revisionNote?: string
): Promise<AgentTask | undefined> {
  return mutateState((s) => {
    const task = s.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    if (task.result) {
      task.drafts.push({ text: task.result, at: task.updatedAt, revisionNote });
    }
    task.revisionNote = revisionNote;
    task.result = undefined;
    task.updatedAt = new Date().toISOString();
    return task;
  });
}

// ── Recurring automations ────────────────────────────────────────────────

export async function listRecurring(): Promise<RecurringTask[]> {
  const s = await readState();
  return [...s.recurring].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createRecurring(
  input: Omit<RecurringTask, "id" | "createdAt" | "enabled"> & { enabled?: boolean }
): Promise<RecurringTask> {
  return mutateState((s) => {
    const rec: RecurringTask = {
      enabled: true,
      ...input,
      id: newId("r"),
      createdAt: new Date().toISOString(),
    };
    s.recurring.push(rec);
    return rec;
  });
}

export async function updateRecurring(
  id: string,
  patch: Partial<RecurringTask>
): Promise<RecurringTask | undefined> {
  return mutateState((s) => {
    const rec = s.recurring.find((r) => r.id === id);
    if (!rec) return undefined;
    Object.assign(rec, patch);
    return rec;
  });
}

export async function deleteRecurring(id: string): Promise<boolean> {
  return mutateState((s) => {
    const before = s.recurring.length;
    s.recurring = s.recurring.filter((r) => r.id !== id);
    return s.recurring.length < before;
  });
}
