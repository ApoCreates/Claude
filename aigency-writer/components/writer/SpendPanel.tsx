"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { fmtUsd } from "@/lib/costs";
import { t, type UILang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Summary {
  totalUsd: number;
  totalRuns: number;
  avgUsd: number;
  todayUsd: number;
  todayRuns: number;
  last30: { date: string; usd: number; runs: number }[];
  byType: { type: string; usd: number; runs: number; avgUsd: number }[];
  recent: {
    at: string;
    runId: string;
    requestType: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheWriteTokens: number;
    cacheReadTokens: number;
    webSearches: number;
    usd: number;
  }[];
  research?: { monthUsd: number; budgetUsd: number };
}

const card = "rounded-xl border border-ink-700 bg-ink-900 p-5";

export default function SpendPanel({ uiLang }: { uiLang: UILang }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/costs", { cache: "no-store" });
      setData(await res.json());
    } catch {
      // panel stays on last data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const last30Usd = data?.last30.reduce((a, d) => a + d.usd, 0) || 0;
  const maxDay = Math.max(0.000001, ...(data?.last30.map((d) => d.usd) || [0]));

  const tiles = data
    ? [
        { label: t("cTotal", uiLang), value: fmtUsd(data.totalUsd), accent: true },
        { label: t("c30d", uiLang), value: fmtUsd(last30Usd) },
        { label: t("cToday", uiLang), value: fmtUsd(data.todayUsd) },
        { label: t("cAvg", uiLang), value: fmtUsd(data.avgUsd) },
        { label: t("cRuns", uiLang), value: String(data.totalRuns) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label mb-1">/ {t("tabCosts", uiLang)}</p>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink-100">
            <Wallet size={20} className="text-qalam" /> {t("costsTitle", uiLang)}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-400">{t("costsIntro", uiLang)}</p>
        </div>
        <button onClick={load} className="btn-secondary px-3 py-1.5">
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Research budget meter — the hard monthly cap on the knowledge garden */}
      {data?.research && (
        <div className={cn(card, "flex flex-wrap items-center gap-4")}>
          <span className="section-label">/ {t("cResearchBudget", uiLang)}</span>
          <div dir="ltr" className="h-2.5 min-w-32 max-w-xs flex-1 overflow-hidden rounded-full bg-ink-800">
            <div
              className={cn(
                "h-full rounded-full",
                data.research.monthUsd / data.research.budgetUsd > 0.85 ? "bg-red-600" : "bg-qalam"
              )}
              style={{
                width: `${Math.min(100, (data.research.monthUsd / data.research.budgetUsd) * 100)}%`,
              }}
            />
          </div>
          <span className="font-mono text-sm text-ink-200">
            {fmtUsd(data.research.monthUsd)} / {fmtUsd(data.research.budgetUsd)}
          </span>
        </div>
      )}

      {data && data.totalRuns === 0 && (
        <div className={cn(card, "text-sm text-ink-400")}>{t("cEmpty", uiLang)}</div>
      )}

      {data && data.totalRuns > 0 && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className={cn(
                  "rounded-xl border p-4",
                  tile.accent
                    ? "border-ink-100 bg-ink-900 shadow-glow"
                    : "border-ink-700 bg-ink-900"
                )}
              >
                <p className="section-label">{tile.label}</p>
                <p
                  className={cn(
                    "mt-1 font-mono text-xl font-semibold",
                    tile.accent ? "text-qalam-soft" : "text-ink-100"
                  )}
                >
                  {tile.value}
                </p>
              </div>
            ))}
          </div>

          {/* Daily bars */}
          <section className={card}>
            <p className="section-label mb-4">/ {t("cDaily", uiLang)}</p>
            <div dir="ltr" className="flex h-32 items-end gap-[3px]">
              {data.last30.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date} — ${fmtUsd(d.usd)} · ${d.runs}`}
                  className="group relative flex-1"
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition",
                      d.usd > 0 ? "bg-qalam group-hover:bg-qalam-soft" : "bg-ink-800"
                    )}
                    style={{ height: `${d.usd > 0 ? Math.max(6, (d.usd / maxDay) * 100) : 3}%` }}
                  />
                </div>
              ))}
            </div>
            <div dir="ltr" className="mt-2 flex justify-between font-mono text-[10px] text-ink-500">
              <span>{data.last30[0]?.date.slice(5)}</span>
              <span>{data.last30[data.last30.length - 1]?.date.slice(5)}</span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By type */}
            <section className={card}>
              <p className="section-label mb-3">/ {t("cByType", uiLang)}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="section-label text-start">
                    <th className="pb-2 text-start font-normal">{t("cType", uiLang)}</th>
                    <th className="pb-2 text-end font-normal">{t("cRuns", uiLang)}</th>
                    <th className="pb-2 text-end font-normal">{t("cAvg", uiLang)}</th>
                    <th className="pb-2 text-end font-normal">{t("cCost", uiLang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byType.map((row) => (
                    <tr key={row.type} className="border-t border-ink-800">
                      <td className="py-2 font-medium text-ink-200">{row.type}</td>
                      <td className="py-2 text-end font-mono text-ink-400">{row.runs}</td>
                      <td className="py-2 text-end font-mono text-ink-400">{fmtUsd(row.avgUsd)}</td>
                      <td className="py-2 text-end font-mono text-qalam-soft">{fmtUsd(row.usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Recent requests */}
            <section className={card}>
              <p className="section-label mb-3">/ {t("cRecent", uiLang)}</p>
              <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
                {data.recent.map((r) => (
                  <div
                    key={r.runId + r.at}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-200">{r.requestType}</p>
                      <p className="font-mono text-[11px] text-ink-500">
                        {new Date(r.at).toLocaleString(uiLang === "ar" ? "ar" : "en", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {r.inputTokens + r.cacheReadTokens + r.cacheWriteTokens}→{r.outputTokens}
                        {r.webSearches > 0 && ` · 🔎${r.webSearches}`}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm text-qalam-soft">{fmtUsd(r.usd)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
