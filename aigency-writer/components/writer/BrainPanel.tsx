"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Download, FlaskConical, Lightbulb, RefreshCw } from "lucide-react";
import type { Insight, Lesson } from "@/lib/brain/types";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BrainData {
  lessons: Lesson[];
  insights: Insight[];
  lastResearchAt: string | null;
  live: boolean;
}

const SOURCE_BADGE: Record<string, { label: { en: string; ar: string }; cls: string }> = {
  coaching: { label: { en: "baked-in", ar: "مُدمج" }, cls: "bg-qalam/15 text-qalam-soft" },
  feedback: { label: { en: "client feedback", ar: "ملاحظة عميل" }, cls: "bg-teal-glow/15 text-teal-glow" },
  training: { label: { en: "training", ar: "تمرين" }, cls: "bg-purple-400/15 text-purple-300" },
  research: { label: { en: "research", ar: "بحث" }, cls: "bg-sky-400/15 text-sky-300" },
};

/**
 * A transparent window into the agent's self-improvement loop: every
 * lesson it has learned and every insight from its daily research —
 * plus the export that bakes runtime learning back into the code.
 */
export default function BrainPanel({ uiLang }: { uiLang: UILang }) {
  const [data, setData] = useState<BrainData | null>(null);
  const [researching, setResearching] = useState(false);

  const load = useCallback(() => {
    fetch("/api/agent/brain")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(load, [load]);

  async function runResearch() {
    setResearching(true);
    try {
      await fetch("/api/agent/research", { method: "POST" });
      load();
    } finally {
      setResearching(false);
    }
  }

  if (!data) return <p className="animate-pulse text-ink-400">…</p>;

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Brain className="text-qalam" size={20} />
          <h2 className="text-lg font-semibold">{t("brainTitle", uiLang)}</h2>
          <div className="ms-auto flex gap-2">
            <button
              onClick={runResearch}
              disabled={researching}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 transition hover:border-qalam hover:text-qalam disabled:opacity-40"
            >
              <RefreshCw size={14} className={cn(researching && "animate-spin")} />
              {researching ? t("researching", uiLang) : t("runResearch", uiLang)}
            </button>
            <a
              href="/api/agent/brain?export=code"
              download="seed.ts"
              className="inline-flex items-center gap-2 rounded-lg bg-qalam px-3 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-qalam-soft"
            >
              <Download size={14} /> {t("exportBrain", uiLang)}
            </a>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">{t("brainIntro", uiLang)}</p>
        <p className="mt-2 text-xs text-ink-500">
          {t("lastResearch", uiLang)}:{" "}
          {data.lastResearchAt
            ? new Date(data.lastResearchAt).toLocaleString(uiLang === "ar" ? "ar" : "en", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : t("never", uiLang)}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
            <FlaskConical size={15} className="text-qalam" />
            {t("lessons", uiLang)}
            <span className="text-xs font-normal text-ink-500">({data.lessons.length})</span>
          </h3>
          <ul className="space-y-2.5">
            {[...data.lessons].reverse().map((l) => {
              const badge = SOURCE_BADGE[l.source] || SOURCE_BADGE.coaching;
              return (
                <li key={l.id} className="rounded-lg border border-ink-700/70 bg-ink-950/60 p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                    <span className={cn("rounded-full px-2 py-0.5 font-medium", badge.cls)}>
                      {badge.label[uiLang]}
                    </span>
                    <span className="rounded-full bg-ink-700 px-2 py-0.5 text-ink-300">{l.lang}</span>
                    <span className="ms-auto text-ink-500">{l.date}</span>
                  </div>
                  <p className="prose-output text-sm text-ink-100" dir="auto">
                    {l.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-200">
            <Lightbulb size={15} className="text-qalam" />
            {t("insights", uiLang)}
            <span className="text-xs font-normal text-ink-500">({data.insights.length})</span>
          </h3>
          <ul className="space-y-2.5">
            {[...data.insights].reverse().map((i) => (
              <li key={i.id} className="rounded-lg border border-ink-700/70 bg-ink-950/60 p-3">
                <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-sky-400/15 px-2 py-0.5 font-medium text-sky-300">
                    {i.topic}
                  </span>
                  <span className="ms-auto text-ink-500">{i.date}</span>
                </div>
                <p className="prose-output text-sm text-ink-100" dir="auto">
                  {i.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
