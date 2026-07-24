/**
 * Spend ledger — persisted next to tasks and the brain so cost history
 * survives serverless restarts. Recording is fail-safe: a storage
 * hiccup must never break the request that produced the tokens.
 */

import { computeCost } from "./costs";
import { mutateState, readState, type SpendRecord, type SpendState } from "./store/persist";

const MAX_RECORDS = 500;

export async function recordSpend(input: {
  runId: string;
  requestType: string;
  model?: string;
  tokens: unknown;
}): Promise<void> {
  const cost = computeCost(input.model, input.tokens);
  if (!cost) return;
  const record: SpendRecord = {
    at: new Date().toISOString(),
    runId: input.runId,
    requestType: input.requestType,
    model: input.model || "unknown",
    inputTokens: cost.inputTokens,
    outputTokens: cost.outputTokens,
    cacheWriteTokens: cost.cacheWriteTokens,
    cacheReadTokens: cost.cacheReadTokens,
    webSearches: cost.webSearches,
    usd: cost.usd,
  };
  try {
    await mutateState((s) => {
      s.spend.totalUsd += record.usd;
      s.spend.totalRuns += 1;
      s.spend.records.push(record);
      if (s.spend.records.length > MAX_RECORDS) {
        s.spend.records = s.spend.records.slice(-MAX_RECORDS);
      }
    });
  } catch (e) {
    console.warn("[spend] failed to persist record (request unaffected):", e);
  }
}

export interface SpendSummary {
  totalUsd: number;
  totalRuns: number;
  avgUsd: number;
  todayUsd: number;
  todayRuns: number;
  last30: { date: string; usd: number; runs: number }[];
  byType: { type: string; usd: number; runs: number; avgUsd: number }[];
  recent: SpendRecord[];
}

export async function getSpendSummary(): Promise<SpendSummary> {
  const spend: SpendState = (await readState()).spend;
  const today = new Date().toISOString().slice(0, 10);

  const byDay = new Map<string, { usd: number; runs: number }>();
  const byType = new Map<string, { usd: number; runs: number }>();
  for (const r of spend.records) {
    const day = r.at.slice(0, 10);
    const d = byDay.get(day) || { usd: 0, runs: 0 };
    d.usd += r.usd;
    d.runs += 1;
    byDay.set(day, d);
    const type = r.requestType.split(":")[0] || "other";
    const t = byType.get(type) || { usd: 0, runs: 0 };
    t.usd += r.usd;
    t.runs += 1;
    byType.set(type, t);
  }

  const last30: SpendSummary["last30"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    const d = byDay.get(date);
    last30.push({ date, usd: d?.usd || 0, runs: d?.runs || 0 });
  }

  const todayAgg = byDay.get(today);
  return {
    totalUsd: spend.totalUsd,
    totalRuns: spend.totalRuns,
    avgUsd: spend.totalRuns ? spend.totalUsd / spend.totalRuns : 0,
    todayUsd: todayAgg?.usd || 0,
    todayRuns: todayAgg?.runs || 0,
    last30,
    byType: [...byType.entries()]
      .map(([type, v]) => ({ type, usd: v.usd, runs: v.runs, avgUsd: v.usd / v.runs }))
      .sort((a, b) => b.usd - a.usd),
    recent: [...spend.records].slice(-25).reverse(),
  };
}
