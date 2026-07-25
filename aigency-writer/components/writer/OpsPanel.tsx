"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, Gauge, Star, Ticket } from "lucide-react";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Summary {
  outputs: number;
  errors: number;
  avgLatencyMs: number | null;
  ratings: number;
  avgRating: number | null;
  flagRate: number;
  openFlags: number;
  avgResolutionHours: number | null;
}
interface Segment { key: string; avgRating: number | null; count: number }
interface QueueItem {
  id: string;
  status: string;
  created_at: string;
  feedback: {
    output_id: string;
    rating: number;
    feedback_text: string | null;
    request_type: string | null;
    client_id: string | null;
  } | null;
}

type Action = "prompt_update" | "knowledge_update" | "guardrail" | "no_action";

/**
 * Diwan ops: the metrics dashboard (rating trend, volume, flag rate,
 * resolution time, prompt-version impact) + the human review queue where
 * every 1–2★ output is resolved with a traceable action.
 */
export default function OpsPanel({ uiLang }: { uiLang: UILang }) {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const local = metrics?.source === "local";
  const [forms, setForms] = useState<Record<string, { action: Action; note: string; patch: string }>>({});

  const load = useCallback(() => {
    fetch("/api/diwan/metrics").then((r) => r.json()).then((d) => {
      setEnabled(Boolean(d.enabled));
      setMetrics(d);
    }).catch(() => setEnabled(false));
    fetch("/api/diwan/review").then((r) => r.json()).then((d) => setQueue((d.queue || []).filter((q: QueueItem) => q.status === "open"))).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function resolve(id: string) {
    const f = forms[id] || { action: "no_action" as Action, note: "", patch: "" };
    await fetch("/api/diwan/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: f.action,
        note: f.note || undefined,
        patchText: f.patch || undefined,
        resolvedBy: "dashboard",
      }),
    });
    load();
  }

  if (enabled === null) return <p className="animate-pulse text-ink-400">…</p>;

  const s = (metrics?.summary || {}) as Partial<Summary>;
  const tiles: { label: string; value: string; icon: typeof Gauge }[] = [
    { label: t("mAvgRating", uiLang), value: s.avgRating != null ? `${s.avgRating}★` : "—", icon: Star },
    { label: t("mOutputs", uiLang), value: String(s.outputs ?? 0), icon: Activity },
    { label: t("mFlagRate", uiLang), value: `${s.flagRate ?? 0}%`, icon: AlertTriangle },
    { label: t("mOpenFlags", uiLang), value: String(s.openFlags ?? queue.length), icon: Ticket },
    { label: t("mResolution", uiLang), value: s.avgResolutionHours != null ? String(s.avgResolutionHours) : "—", icon: Gauge },
    { label: t("mErrors", uiLang), value: String(s.errors ?? 0), icon: AlertTriangle },
  ];

  const segTable = (title: string, rows: Segment[]) => (
    <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-ink-200">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-ink-500">—</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.key} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink-300" dir="auto">{r.key}</span>
              <span className={cn("font-medium", (r.avgRating ?? 5) < 3.5 ? "text-red-700" : "text-teal-glow")}>
                {r.avgRating ?? "—"}★
              </span>
              <span className="text-xs text-ink-500">×{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <div className="flex items-center gap-3">
          <Gauge className="text-qalam" size={20} />
          <h2 className="text-lg font-semibold">{t("opsTitle", uiLang)}</h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">{t("opsIntro", uiLang)}</p>
      </header>

      {!enabled && (
        <div className="rounded-xl border border-qalam/40 bg-qalam/5 p-4 text-sm leading-relaxed text-qalam-soft" dir="auto">
          {t("opsNotConfigured", uiLang)}
        </div>
      )}

      {/* Local mode is not an error — a quiet setup hint is enough */}
      {enabled && local && (
        <p className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-xs leading-relaxed text-ink-400" dir="auto">
          {t("opsLocalMode", uiLang)}
        </p>
      )}

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-400">
                  <Icon size={12} /> {label}
                </div>
                <div className="mt-1 text-xl font-semibold text-ink-100">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {segTable(t("byTypeTitle", uiLang), (metrics?.byRequestType || []) as Segment[])}
            {!local && segTable(t("byClientTitle", uiLang), (metrics?.byClient || []) as Segment[])}
          </div>

          {!local && (
          <>
          <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink-200">{t("versionsTitle", uiLang)}</h3>
            <ul className="space-y-1.5">
              {((metrics?.versionImpact || []) as { id: string; hash: string; createdAt: string; avgRating: number | null; ratings: number }[])
                .slice(0, 8)
                .map((v) => (
                  <li key={v.id} className="flex items-center gap-2 text-sm">
                    <code className="text-xs text-ink-400">{v.hash.slice(0, 10)}</code>
                    <span className="text-xs text-ink-500">{v.createdAt.slice(0, 10)}</span>
                    <span className="ms-auto font-medium text-ink-200">{v.avgRating ?? "—"}★</span>
                    <span className="text-xs text-ink-500">×{v.ratings}</span>
                  </li>
                ))}
            </ul>
          </section>

          <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink-200">{t("ticketsTitle", uiLang)}</h3>
            {((metrics?.tickets || []) as { scope: Record<string, string>; avg_rating: number; rating_count: number; status: string; suspected_cause: string }[]).length === 0 ? (
              <p className="text-xs text-ink-500">—</p>
            ) : (
              <ul className="space-y-2">
                {((metrics?.tickets || []) as { scope: Record<string, string>; avg_rating: number; rating_count: number; status: string; suspected_cause: string }[]).map((tk, i) => (
                  <li key={i} className="rounded-lg border border-ink-700 bg-ink-950/50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] text-red-700">
                        {tk.avg_rating}★ ×{tk.rating_count}
                      </span>
                      <code className="text-xs text-ink-400">{JSON.stringify(tk.scope)}</code>
                      <span className="ms-auto text-[11px] text-ink-500">{tk.status}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-400" dir="auto">{tk.suspected_cause}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </>
          )}
        </>
      )}

      {/* Human review queue */}
      <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink-200">{t("queueTitle", uiLang)}</h3>
        {queue.length === 0 ? (
          <p className="text-xs text-ink-500">{t("queueEmpty", uiLang)}</p>
        ) : (
          <div className="space-y-3">
            {queue.map((q) => {
              const f = forms[q.id] || { action: "no_action" as Action, note: "", patch: "" };
              const needsPatch = f.action === "prompt_update" || f.action === "guardrail" || f.action === "knowledge_update";
              return (
                <div key={q.id} className="rounded-lg border border-red-600/30 bg-ink-950/50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      {q.feedback?.rating}★
                    </span>
                    <span className="text-xs text-ink-400">{q.feedback?.request_type}</span>
                    {q.feedback?.client_id && (
                      <span className="text-xs text-ink-500">{q.feedback.client_id}</span>
                    )}
                    <span className="ms-auto text-[11px] text-ink-500">{q.created_at.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  {q.feedback?.feedback_text && (
                    <p className="prose-output mt-2 text-sm text-ink-200" dir="auto">
                      {q.feedback.feedback_text}
                    </p>
                  )}
                  <div className="mt-2 grid gap-2 sm:grid-cols-[200px_1fr]">
                    <select
                      value={f.action}
                      onChange={(e) => setForms((p) => ({ ...p, [q.id]: { ...f, action: e.target.value as Action } }))}
                      className="rounded-md border border-ink-600 bg-ink-950 px-2 py-1.5 text-sm outline-none focus:border-qalam"
                    >
                      <option value="prompt_update">{t("actPrompt", uiLang)}</option>
                      <option value="knowledge_update">{t("actKnowledge", uiLang)}</option>
                      <option value="guardrail">{t("actGuardrail", uiLang)}</option>
                      <option value="no_action">{t("actNoAction", uiLang)}</option>
                    </select>
                    <input
                      value={f.note}
                      onChange={(e) => setForms((p) => ({ ...p, [q.id]: { ...f, note: e.target.value } }))}
                      placeholder={t("notePlaceholder", uiLang)}
                      dir="auto"
                      className="rounded-md border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm outline-none placeholder:text-ink-500 focus:border-qalam"
                    />
                  </div>
                  {needsPatch && (
                    <textarea
                      value={f.patch}
                      onChange={(e) => setForms((p) => ({ ...p, [q.id]: { ...f, patch: e.target.value } }))}
                      placeholder={t("patchPlaceholder", uiLang)}
                      rows={2}
                      dir="auto"
                      className="mt-2 w-full resize-y rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none placeholder:text-ink-500 focus:border-qalam"
                    />
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => resolve(q.id)}
                      disabled={needsPatch && f.action !== "knowledge_update" && !f.patch.trim()}
                      className="btn-primary px-4 py-1.5"
                    >
                      {t("resolveBtn", uiLang)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
