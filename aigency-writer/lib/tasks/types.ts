import type { ModeId } from "../ai/modes";
import type { BrandProfile, Dialect, OutputLang } from "../profiles";

export type TaskStatus = "queued" | "running" | "review" | "approved" | "archived";
export type TaskPriority = "low" | "normal" | "high";

export interface TaskDraft {
  text: string;
  at: string;
  /** The coach note that triggered the next revision (if any) */
  revisionNote?: string;
}

/**
 * A standing automation: the daily scheduler (/api/agent/scheduler, run by
 * Vercel Cron) turns each enabled RecurringTask into a fresh AgentTask,
 * executes it, and emails the deliverable if emailTo is set.
 */
export interface RecurringTask {
  id: string;
  title: string;
  brief: string;
  mode: ModeId;
  outputLang: OutputLang;
  dialect?: Dialect;
  priority: TaskPriority;
  /** Where to send the deliverable each day (requires RESEND_API_KEY) */
  emailTo?: string;
  /** Snapshot of the client profile to write with */
  profile?: BrandProfile | null;
  enabled: boolean;
  createdAt: string;
  lastRunAt?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  brief: string;
  mode: ModeId;
  outputLang: OutputLang;
  dialect?: Dialect;
  priority: TaskPriority;
  due?: string;
  /** Snapshot of the client profile at assignment time */
  profile?: BrandProfile | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  /** Latest deliverable */
  result?: string;
  /** Pending coach note the next run must address */
  revisionNote?: string;
  /** Earlier drafts, most recent last */
  drafts: TaskDraft[];
  error?: string;
  /** Set when this task was spawned by a recurring automation */
  recurringId?: string;
  /** Whether the deliverable was emailed (recurring tasks) */
  emailedTo?: string;
}
