/**
 * Cost accounting for every Anthropic call the agent makes.
 *
 * Pricing is per million tokens (MTok). Cache writes bill at 1.25× input,
 * cache reads at 0.1× input — which is why the layered system prompt is
 * cached (see lib/ai/persona.ts). Web search bills per request on top of
 * tokens. Unknown/overridden models fall back to Sonnet pricing so a
 * model swap can never silently record $0.
 */

export interface ModelPricing {
  input: number; // $ / MTok
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export const PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};

export const WEB_SEARCH_USD = 0.01; // $10 per 1000 searches

const FALLBACK = PRICING["claude-sonnet-4-6"];

export function pricingFor(model: string | undefined | null): ModelPricing {
  if (!model) return FALLBACK;
  const key = Object.keys(PRICING).find((k) => model.startsWith(k));
  return key ? PRICING[key] : FALLBACK;
}

/** Shape-tolerant view of Anthropic's usage object. */
export interface UsageLike {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number } | null;
}

export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  webSearches: number;
  usd: number;
}

export function computeCost(model: string | undefined, usage: unknown): CostBreakdown | null {
  if (!usage || typeof usage !== "object") return null;
  const u = usage as UsageLike;
  const p = pricingFor(model);
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  const cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = u.cache_read_input_tokens ?? 0;
  const webSearches = u.server_tool_use?.web_search_requests ?? 0;
  const usd =
    (inputTokens * p.input +
      outputTokens * p.output +
      cacheWriteTokens * p.cacheWrite +
      cacheReadTokens * p.cacheRead) /
      1_000_000 +
    webSearches * WEB_SEARCH_USD;
  if (!inputTokens && !outputTokens && !cacheWriteTokens && !cacheReadTokens) return null;
  return { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, webSearches, usd };
}

/**
 * Pre-flight estimate shown next to the generate/assign buttons.
 * Assumes the stable system prompt is a cache HIT (~2k tokens at 0.1×,
 * the steady-state case) and scales expected output with the brief and
 * whether one or both languages were requested.
 */
export function estimateWriteUsd(opts: {
  briefChars: number;
  outputLang?: "ar" | "en" | "both";
  model?: string;
}): number {
  const p = pricingFor(opts.model);
  const cachedSystem = 2100; // stable blocks, read from cache
  const volatile = 260; // output contract + task frame
  const briefTokens = Math.ceil(opts.briefChars / 3.4); // Arabic runs denser than 4 chars/tok
  const outputTokens = Math.round(
    Math.min(3800, 700 + opts.briefChars * 0.9) * (opts.outputLang === "both" ? 1.7 : 1)
  );
  return (
    (cachedSystem * p.cacheRead +
      (volatile + briefTokens) * p.input +
      outputTokens * p.output) /
    1_000_000
  );
}

/** "$0.0182" → "$0.02", tiny values keep enough digits to be honest. */
export function fmtUsd(usd: number): string {
  if (usd >= 100) return `$${Math.round(usd)}`;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd > 0) return `$${usd.toFixed(4)}`;
  return "$0.00";
}
