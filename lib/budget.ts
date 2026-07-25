// Monthly spend guardrail for the tutor.
//
// Two things keep the bill tiny:
//  1. The answer engine (lib/answers.ts) serves most questions for $0, so the
//     paid API is a fallback, not the default path.
//  2. This soft cap stops live calls once the estimated month-to-date spend
//     crosses MONTHLY_BUDGET_USD (default $10); over the cap the tutor still
//     works, it just answers from the local engine / canned mode.
//
// IMPORTANT: serverless runs many short-lived instances, so this in-memory
// counter is BEST-EFFORT, not a hard ceiling. The authoritative $10 cap is the
// spend limit set in the Anthropic Console (Billing → Usage limits). This
// layer's real value is keeping spend far below that limit in the first place.

export const MONTHLY_BUDGET_USD = Number(process.env.MONTHLY_BUDGET_USD ?? "10");

// Approximate USD per million tokens (input, output). Estimate only — for the
// soft cap, not billing. Matched by prefix so dated model ids resolve.
const PRICING: { prefix: string; in: number; out: number }[] = [
  { prefix: "claude-haiku-4-5", in: 1, out: 5 },
  { prefix: "claude-3-5-haiku", in: 0.8, out: 4 },
  { prefix: "claude-sonnet-5", in: 3, out: 15 },
  { prefix: "claude-sonnet-4-5", in: 3, out: 15 },
  { prefix: "claude-3-7-sonnet", in: 3, out: 15 },
  { prefix: "claude-3-5-sonnet", in: 3, out: 15 },
];

function priceFor(model: string) {
  return PRICING.find((p) => model.startsWith(p.prefix)) ?? { in: 3, out: 15 };
}

/** Estimate one call's cost. Cache reads are billed at ~10% of input. */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0
): number {
  const p = priceFor(model);
  return (
    (inputTokens / 1e6) * p.in +
    (cacheReadTokens / 1e6) * p.in * 0.1 +
    (outputTokens / 1e6) * p.out
  );
}

interface MonthSpend {
  month: string;
  usd: number;
  calls: number;
}

// Persist across warm invocations of the same instance.
const store = globalThis as unknown as { __wadehSpend?: MonthSpend };

function monthKey(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function current(): MonthSpend {
  const m = monthKey();
  if (!store.__wadehSpend || store.__wadehSpend.month !== m) {
    store.__wadehSpend = { month: m, usd: 0, calls: 0 };
  }
  return store.__wadehSpend;
}

export function spentThisMonthUsd(): number {
  return current().usd;
}

export function budgetRemainingUsd(): number {
  return Math.max(0, MONTHLY_BUDGET_USD - current().usd);
}

export function withinBudget(): boolean {
  return current().usd < MONTHLY_BUDGET_USD;
}

export function recordSpend(usd: number): void {
  const c = current();
  c.usd += usd;
  c.calls += 1;
}

export function callsThisMonth(): number {
  return current().calls;
}
