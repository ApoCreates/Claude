"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Dumbbell, GraduationCap, Play, Timer } from "lucide-react";
import type { TrainingPlan } from "@/lib/training/scenarios";
import type { BrandProfile } from "@/lib/profiles";
import { MODE_MAP } from "@/lib/ai/modes";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CopyButton } from "./shared";

type DrillState = {
  output: string;
  running: boolean;
  coached: boolean;
  approved: boolean;
  runId?: string;
};

/**
 * The Training Gym — the daily ~30-minute practice session. Three Arabic
 * drills, three English drills, all different disciplines. You are the
 * coach: run each drill, then approve or correct. Corrections are
 * distilled into permanent lessons in the agent's brain.
 */
export default function TrainingPanel({
  uiLang,
  profile,
}: {
  uiLang: UILang;
  profile: BrandProfile;
}) {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [states, setStates] = useState<Record<string, DrillState>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/training")
      .then((r) => r.json())
      .then(setPlan)
      .catch(() => setPlan(null));
  }, []);

  function patch(id: string, p: Partial<DrillState>) {
    setStates((prev) => {
      const base: DrillState =
        prev[id] || { output: "", running: false, coached: false, approved: false };
      return { ...prev, [id]: { ...base, ...p } };
    });
  }

  async function runDrill(drillId: string) {
    patch(drillId, { running: true, output: "" });
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drillId, date: plan?.date, profile }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error(res.statusText);
      const runId = res.headers.get("X-Run-Id") || undefined;
      patch(drillId, { runId });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        patch(drillId, { output: acc, running: true });
      }
      patch(drillId, { running: false });
    } catch (e) {
      patch(drillId, { running: false, output: `⚠️ ${(e as Error).message}` });
    }
  }

  async function coach(drillId: string, mode: string, approve: boolean) {
    const s = states[drillId];
    const note = notes[drillId]?.trim();
    if (!approve && !note) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        rating: approve ? "up" : "down",
        stars: approve ? 5 : 2,
        runId: s?.runId,
        clientId: profile.id,
        comment: note || undefined,
        excerpt: s?.output?.slice(0, 1500),
        source: "training",
      }),
    });
    patch(drillId, approve ? { approved: true } : { coached: true });
  }

  if (!plan) {
    return <p className="animate-pulse text-ink-400">…</p>;
  }

  const done = plan.drills.filter((d) => states[d.id]?.approved || states[d.id]?.coached).length;

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Dumbbell className="text-qalam" size={20} />
          <h2 className="text-lg font-semibold">{t("trainingTitle", uiLang)}</h2>
          <span className="rounded-full border border-ink-600 px-3 py-1 text-xs text-ink-300">
            {plan.date}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 px-3 py-1 text-xs text-ink-300">
            <Timer size={12} /> {plan.totalMinutes} {t("minutes", uiLang)}
          </span>
          <span className="ms-auto text-sm text-ink-400">
            {done}/{plan.drills.length}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">
          {t("trainingIntro", uiLang)}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full bg-qalam transition-all"
            style={{ width: `${(done / plan.drills.length) * 100}%` }}
          />
        </div>
      </header>

      {plan.drills.map((drill, idx) => {
        const s = states[drill.id];
        const mode = MODE_MAP[drill.mode];
        const isAr = drill.lang === "ar";
        const settled = s?.approved || s?.coached;
        return (
          <article
            key={drill.id}
            className={cn(
              "rounded-xl border p-4",
              settled ? "border-teal-glow/40 bg-ink-900/40" : "border-ink-700 bg-ink-900/60"
            )}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 text-xs font-semibold text-ink-200">
                {idx + 1}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  isAr ? "bg-qalam/15 text-qalam-soft" : "bg-teal-glow/15 text-teal-glow"
                )}
              >
                {isAr ? "العربية" : "English"}
              </span>
              <span className="text-sm font-medium">{drill.title[uiLang]}</span>
              <span className="text-xs text-ink-400">
                {mode.label[uiLang]} · {drill.minutes} {t("minutes", uiLang)}
              </span>
              {settled && <CheckCircle2 size={16} className="ms-auto text-teal-glow" />}
            </div>

            <p className="prose-output mt-3 rounded-lg bg-ink-950/70 p-3 text-sm text-ink-200" dir="auto">
              {drill.task}
            </p>

            {!s?.output && (
              <button
                onClick={() => runDrill(drill.id)}
                disabled={s?.running}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-qalam px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft disabled:opacity-40"
              >
                <Play size={14} /> {s?.running ? t("running", uiLang) : t("runDrill", uiLang)}
              </button>
            )}

            {s?.output && (
              <div className="mt-3 rounded-lg border border-qalam/25 bg-ink-950/60 p-4">
                <div className="prose-output" dir="auto">
                  {s.output}
                </div>
                {!s.running && (
                  <div className="mt-3 flex gap-2">
                    <CopyButton text={s.output} lang={uiLang} />
                  </div>
                )}
              </div>
            )}

            {s?.output && !s.running && !settled && (
              <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900/70 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-ink-400">
                  <GraduationCap size={14} className="text-qalam" />
                  {t("feedbackPrompt", uiLang)}
                </div>
                <textarea
                  value={notes[drill.id] || ""}
                  onChange={(e) => setNotes((p) => ({ ...p, [drill.id]: e.target.value }))}
                  placeholder={t("coachPlaceholder", uiLang)}
                  rows={2}
                  dir="auto"
                  className="w-full resize-y rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none placeholder:text-ink-500 focus:border-qalam"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => coach(drill.id, drill.mode, true)}
                    className="rounded-md border border-teal-glow/50 px-3 py-1.5 text-sm text-teal-glow transition hover:bg-teal-glow/10"
                  >
                    {t("approve", uiLang)}
                  </button>
                  <button
                    onClick={() => coach(drill.id, drill.mode, false)}
                    disabled={!notes[drill.id]?.trim()}
                    className="rounded-md bg-qalam px-3 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft disabled:opacity-40"
                  >
                    {t("correct", uiLang)}
                  </button>
                </div>
              </div>
            )}

            {settled && (
              <p className="mt-3 text-xs text-teal-glow">{t("feedbackSaved", uiLang)}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
