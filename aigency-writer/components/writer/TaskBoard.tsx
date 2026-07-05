"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Flag,
  Loader2,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { MODES, MODE_MAP, type ModeId } from "@/lib/ai/modes";
import { DIALECTS, type BrandProfile, type Dialect, type OutputLang } from "@/lib/profiles";
import type { AgentTask, TaskPriority, TaskStatus } from "@/lib/tasks/types";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CopyButton } from "./shared";

const STATUS_STYLE: Record<TaskStatus, string> = {
  queued: "bg-ink-600/40 text-ink-200",
  running: "bg-sky-400/15 text-sky-300",
  review: "bg-qalam/15 text-qalam-soft",
  approved: "bg-teal-glow/15 text-teal-glow",
  archived: "bg-ink-700 text-ink-400",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "text-red-400",
  normal: "text-qalam-soft",
  low: "text-ink-400",
};

function statusLabel(s: TaskStatus, lang: UILang): string {
  const map: Record<TaskStatus, string> = {
    queued: t("statusQueued", lang),
    running: t("statusRunning", lang),
    review: t("statusReview", lang),
    approved: t("statusApproved", lang),
    archived: t("statusArchived", lang),
  };
  return map[s];
}

/**
 * The agent dashboard: assign tasks, watch the agent work, review the
 * deliverables. Change requests re-queue the task AND teach the brain.
 */
export default function TaskBoard({
  uiLang,
  profile,
}: {
  uiLang: UILang;
  profile: BrandProfile;
}) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [revisions, setRevisions] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState(false);
  const runningRef = useRef<Set<string>>(new Set());

  // New-task form
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [mode, setMode] = useState<ModeId>("copywriting");
  const [outputLang, setOutputLang] = useState<OutputLang>("both");
  const [dialect, setDialect] = useState<Dialect>(profile.dialect);
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [due, setDue] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || {});
    } catch {
      // transient — next poll retries
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const runTask = useCallback(
    async (id: string) => {
      if (runningRef.current.has(id)) return;
      runningRef.current.add(id);
      try {
        await fetch(`/api/tasks/${id}/run`, { method: "POST" });
      } finally {
        runningRef.current.delete(id);
        load();
      }
    },
    [load]
  );

  // The agent picks up queued work automatically (unless it errored —
  // those wait for an explicit retry).
  useEffect(() => {
    for (const task of tasks) {
      if (task.status === "queued" && !task.error && !runningRef.current.has(task.id)) {
        runTask(task.id);
      }
    }
  }, [tasks, runTask]);

  async function assign() {
    if (!brief.trim() || assigning) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brief,
          mode,
          outputLang,
          dialect: outputLang === "en" ? undefined : dialect,
          priority,
          due: due || undefined,
          profile,
        }),
      });
      if (res.ok) {
        setTitle("");
        setBrief("");
        setDue("");
        await load();
      }
    } finally {
      setAssigning(false);
    }
  }

  async function review(task: AgentTask, action: "approve" | "archive" | "requeue") {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function requestChanges(task: AgentTask) {
    const comment = revisions[task.id]?.trim();
    if (!comment) return;
    // The note teaches the brain AND drives the revision.
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: task.mode,
        rating: "down",
        comment,
        excerpt: task.result?.slice(0, 1500),
        source: "feedback",
      }),
    });
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_changes", comment }),
    });
    setRevisions((p) => ({ ...p, [task.id]: "" }));
    load();
  }

  const field =
    "rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none placeholder:text-ink-500 focus:border-qalam";
  const visible = tasks.filter((task) => task.status !== "archived");

  return (
    <div className="space-y-5">
      {/* Header + stats */}
      <header className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <ClipboardList className="text-qalam" size={20} />
          <h2 className="text-lg font-semibold">{t("tasksTitle", uiLang)}</h2>
          <div className="ms-auto flex gap-2">
            {(["queued", "running", "review", "approved"] as TaskStatus[]).map((s) => (
              <span key={s} className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[s])}>
                {statusLabel(s, uiLang)}: {stats[s] || 0}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">{t("tasksIntro", uiLang)}</p>
      </header>

      {/* Assignment form */}
      <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-200">{t("newTask", uiLang)}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-300">{t("taskTitleLabel", uiLang)}</span>
            <input className={cn(field, "w-full")} value={title} dir="auto"
              onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-300">{t("taskBriefLabel", uiLang)}</span>
            <textarea
              className={cn(field, "min-h-[90px] w-full resize-y")}
              value={brief}
              dir="auto"
              placeholder={t("taskBriefPlaceholder", uiLang)}
              onChange={(e) => setBrief(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{t("modeLabel", uiLang)}</span>
            <select className={cn(field, "w-full")} value={mode}
              onChange={(e) => setMode(e.target.value as ModeId)}>
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label[uiLang]}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{t("outputLang", uiLang)}</span>
            <select className={cn(field, "w-full")} value={outputLang}
              onChange={(e) => setOutputLang(e.target.value as OutputLang)}>
              <option value="ar">{t("arabicOnly", uiLang)}</option>
              <option value="en">{t("englishOnly", uiLang)}</option>
              <option value="both">{t("bothLangs", uiLang)}</option>
            </select>
          </label>
          {outputLang !== "en" && (
            <label className="block text-sm">
              <span className="mb-1 block text-ink-300">{t("dialect", uiLang)}</span>
              <select className={cn(field, "w-full")} value={dialect}
                onChange={(e) => setDialect(e.target.value as Dialect)}>
                {DIALECTS.map((d) => (
                  <option key={d.id} value={d.id}>{uiLang === "ar" ? d.ar : d.en}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{t("priorityLabel", uiLang)}</span>
            <select className={cn(field, "w-full")} value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="high">{t("priorityHigh", uiLang)}</option>
              <option value="normal">{t("priorityNormal", uiLang)}</option>
              <option value="low">{t("priorityLow", uiLang)}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-300">{t("dueLabel", uiLang)}</span>
            <input type="date" className={cn(field, "w-full")} value={due}
              onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={assign}
            disabled={!brief.trim() || assigning}
            className="inline-flex items-center gap-2 rounded-lg bg-qalam px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft disabled:opacity-40"
          >
            <Send size={14} /> {t("assignTask", uiLang)}
          </button>
        </div>
      </section>

      {/* Board */}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-700 p-8 text-center text-sm text-ink-400">
          {t("noTasks", uiLang)}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((task) => {
            const modeInfo = MODE_MAP[task.mode];
            const isOpen = expanded[task.id] ?? task.status === "review";
            return (
              <article key={task.id} className="rounded-xl border border-ink-700 bg-ink-900/60">
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [task.id]: !isOpen }))}
                  className="flex w-full flex-wrap items-center gap-2.5 p-4 text-start"
                >
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLE[task.status])}>
                    {task.status === "running" && <Loader2 size={10} className="me-1 inline animate-spin" />}
                    {statusLabel(task.status, uiLang)}
                  </span>
                  <span className="text-sm font-medium" dir="auto">{task.title}</span>
                  <span className="text-xs text-ink-400">{modeInfo.label[uiLang]}</span>
                  <Flag size={12} className={PRIORITY_COLOR[task.priority]} />
                  {task.due && (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                      <CalendarClock size={12} /> {task.due}
                    </span>
                  )}
                  {task.drafts.length > 0 && (
                    <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[11px] text-ink-300">
                      {t("revisionRound", uiLang)} {task.drafts.length}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className={cn("ms-auto text-ink-400 transition-transform", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-ink-700/70 p-4">
                    <p className="prose-output rounded-lg bg-ink-950/70 p-3 text-sm text-ink-300" dir="auto">
                      {task.brief}
                    </p>

                    {task.error && (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-400/40 bg-red-400/5 p-3 text-sm text-red-300">
                        <span className="min-w-0 flex-1" dir="auto">⚠️ {task.error}</span>
                        <button
                          onClick={() => review(task, "requeue")}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-red-400/50 px-3 py-1.5 text-xs hover:bg-red-400/10"
                        >
                          <RotateCcw size={12} /> {t("retry", uiLang)}
                        </button>
                      </div>
                    )}

                    {task.status === "running" && (
                      <p className="mt-3 animate-pulse text-sm text-sky-300">{t("statusRunning", uiLang)}</p>
                    )}

                    {task.result && (
                      <div className="mt-3 rounded-lg border border-qalam/25 bg-ink-950/60 p-4">
                        <div className="prose-output" dir="auto">{task.result}</div>
                        <div className="mt-3 flex gap-2">
                          <CopyButton text={task.result} lang={uiLang} />
                        </div>
                      </div>
                    )}

                    {task.drafts.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-ink-400 hover:text-ink-200">
                          {t("previousDrafts", uiLang)} ({task.drafts.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {task.drafts.map((d, i) => (
                            <div key={i} className="rounded-lg border border-ink-700 bg-ink-950/50 p-3">
                              {d.revisionNote && (
                                <p className="mb-2 text-xs text-qalam-soft" dir="auto">✎ {d.revisionNote}</p>
                              )}
                              <p className="prose-output max-h-40 overflow-y-auto text-xs text-ink-400" dir="auto">
                                {d.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {task.status === "review" && (
                      <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900/70 p-3">
                        <textarea
                          value={revisions[task.id] || ""}
                          onChange={(e) => setRevisions((p) => ({ ...p, [task.id]: e.target.value }))}
                          placeholder={t("revisionPlaceholder", uiLang)}
                          rows={2}
                          dir="auto"
                          className="w-full resize-y rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none placeholder:text-ink-500 focus:border-qalam"
                        />
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => review(task, "approve")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-teal-glow/50 px-3 py-1.5 text-sm text-teal-glow hover:bg-teal-glow/10"
                          >
                            <CheckCircle2 size={14} /> {t("approveTask", uiLang)}
                          </button>
                          <button
                            onClick={() => requestChanges(task)}
                            disabled={!revisions[task.id]?.trim()}
                            className="rounded-md bg-qalam px-3 py-1.5 text-sm font-semibold text-ink-950 hover:bg-qalam-soft disabled:opacity-40"
                          >
                            {t("requestChanges", uiLang)}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.status === "queued" && task.error === undefined && (
                        <button
                          onClick={() => runTask(task.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-ink-300 hover:border-qalam hover:text-qalam"
                        >
                          <Play size={12} /> {t("runNow", uiLang)}
                        </button>
                      )}
                      {(task.status === "approved" || task.status === "review") && (
                        <button
                          onClick={() => review(task, "archive")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-ink-400 hover:border-ink-400 hover:text-ink-200"
                        >
                          <Archive size={12} /> {t("archiveTask", uiLang)}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
