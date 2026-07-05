/**
 * Task queue for the agent dashboard. Same persistence model as the brain:
 * module memory (survives dev reloads via globalThis), seam documented for
 * KV/Postgres. Tasks are the unit of delegation — you assign, the agent
 * executes, you review.
 */

import type { AgentTask, TaskStatus } from "./types";

const MAX_TASKS = 200;

const g = globalThis as unknown as { __qalamTasks?: AgentTask[] };

function all(): AgentTask[] {
  if (!g.__qalamTasks) g.__qalamTasks = [];
  return g.__qalamTasks;
}

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

export function listTasks(): AgentTask[] {
  return [...all()].sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function getTask(id: string): AgentTask | undefined {
  return all().find((t) => t.id === id);
}

export function createTask(
  input: Omit<AgentTask, "id" | "status" | "createdAt" | "updatedAt" | "drafts">
): AgentTask {
  const now = new Date().toISOString();
  const task: AgentTask = {
    ...input,
    id: `t-${Math.random().toString(36).slice(2, 10)}`,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    drafts: [],
  };
  const tasks = all();
  tasks.push(task);
  if (tasks.length > MAX_TASKS) {
    // Evict oldest archived/approved first; never evict active work
    const evictable = tasks
      .filter((t) => t.status === "archived" || t.status === "approved")
      .slice(0, tasks.length - MAX_TASKS)
      .map((t) => t.id);
    const keep = new Set(tasks.map((t) => t.id).filter((id) => !evictable.includes(id)));
    g.__qalamTasks = tasks.filter((t) => keep.has(t.id));
  }
  return task;
}

export function updateTask(id: string, patch: Partial<AgentTask>): AgentTask | undefined {
  const task = getTask(id);
  if (!task) return undefined;
  Object.assign(task, patch, { updatedAt: new Date().toISOString() });
  return task;
}

/** Move the current result into drafts (with the coach note) before a rerun. */
export function pushDraft(id: string, revisionNote?: string): AgentTask | undefined {
  const task = getTask(id);
  if (!task) return undefined;
  if (task.result) {
    task.drafts.push({ text: task.result, at: task.updatedAt, revisionNote });
  }
  task.revisionNote = revisionNote;
  task.result = undefined;
  task.updatedAt = new Date().toISOString();
  return task;
}

export function taskStats(): Record<TaskStatus, number> {
  const stats: Record<TaskStatus, number> = {
    queued: 0,
    running: 0,
    review: 0,
    approved: 0,
    archived: 0,
  };
  for (const t of all()) stats[t.status]++;
  return stats;
}
