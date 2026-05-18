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

export async function completeText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const c = getClient();
  if (!c) return ""; // caller decides fallback
  const resp = await c.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 800,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const part = resp.content.find((b) => b.type === "text");
  return part && part.type === "text" ? part.text : "";
}
