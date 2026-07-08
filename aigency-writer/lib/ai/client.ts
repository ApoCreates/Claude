import Anthropic from "@anthropic-ai/sdk";

/** Writing model — quality matters here (Sonnet: $3/$15 per MTok). */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/**
 * Utility model for mechanical work (feedback → lesson distillation).
 * Haiku is ~3× cheaper ($1/$5 per MTok) and plenty for one-line rules.
 */
export const UTILITY_MODEL = process.env.ANTHROPIC_UTILITY_MODEL || "claude-haiku-4-5";

export function hasLiveAI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
