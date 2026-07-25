import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MODEL_CASCADE } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 30;
// Must run per-request — otherwise Next bakes the build-time result in.
export const dynamic = "force-dynamic";

// Diagnostic endpoint: reports whether the API key is visible to the
// function and which Claude model actually answers. Never leaks the key —
// only its prefix and length.
export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const envNames = Object.keys(process.env).filter((k) => /ANTHROPIC|CLAUDE/i.test(k));

  if (!key) {
    return NextResponse.json({
      hasKey: false,
      matchingEnvNames: envNames,
      hint: "ANTHROPIC_API_KEY is not visible to the production function.",
    });
  }

  const client = new Anthropic({ apiKey: key });
  const attempts: { model: string; ok: boolean; error?: string }[] = [];
  for (const model of MODEL_CASCADE) {
    try {
      await client.messages.create({ model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] });
      attempts.push({ model, ok: true });
      break;
    } catch (e) {
      attempts.push({ model, ok: false, error: e instanceof Error ? e.message.slice(0, 160) : "unknown" });
    }
  }

  return NextResponse.json({
    hasKey: true,
    keyPrefix: key.slice(0, 10) + "…",
    keyLength: key.length,
    matchingEnvNames: envNames,
    attempts,
    live: attempts.some((a) => a.ok),
  });
}
