import Anthropic from "@anthropic-ai/sdk";

export function hasLiveAI() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
export function getClient(): Anthropic | null {
  if (!hasLiveAI()) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
