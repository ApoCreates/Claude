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
}
