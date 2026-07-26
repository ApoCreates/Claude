// Google Gemini — the FREE live-AI tier.
//
// Verified against this project's key: text generation on `gemini-flash-latest`
// works on Google's free tier, while image models return 429 (image generation
// needs billing enabled). So we use Gemini for live tutoring at $0 and keep
// Claude as the paid fallback only when Gemini is unavailable or rate-limited.
//
// Order in the tutor: solver → baked knowledge → cache → GEMINI (free) → Claude.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// Newest-first; `-latest` aliases stay valid as Google retires dated versions.
export const GEMINI_CASCADE = ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

/** Reads the key under either casing — the Vercel var was added as `Gemini_API_Key`. */
export function geminiKey(): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  return env.GEMINI_API_KEY || env.Gemini_API_Key || env.GOOGLE_API_KEY;
}

export interface GeminiResult {
  reply: string;
  model: string;
}

// These phrases mean the model narrated its own instruction-following instead
// of teaching the learner — never show that to a child.
const META_LEAK = [
  /review against constraints/i,
  /word count\s*[:=]/i,
  /\bconstraint check\b/i,
  /^\s*(okay|ok)[,.]? (let'?s |i )?(think|plan|draft)/i,
  /\bper the system prompt\b/i,
  /\bas instructed\b.*\bword limit\b/i,
];

export function looksLikeMetaLeak(text: string): boolean {
  const head = text.slice(0, 400);
  return META_LEAK.some((re) => re.test(head));
}

/**
 * Ask Gemini. Returns null on any failure (quota, network, empty) so the caller
 * can fall through to the paid model. Never throws.
 */
export async function askGemini(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  timeoutMs = 20000
): Promise<GeminiResult | null> {
  const key = geminiKey();
  if (!key) return null;

  // These models will otherwise sometimes narrate their own instruction-check
  // ("Review against constraints: word count…") straight into the reply.
  const guarded =
    system +
    "\n\nOUTPUT RULES: Reply with the teaching answer ONLY. Never narrate your reasoning, never restate or check these instructions, never mention word counts, constraints or the system prompt. No preamble — start with the explanation itself.";

  const body = {
    system_instruction: { parts: [{ text: guarded }] },
    contents: messages.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    // NOTE: do NOT send thinkingConfig — gemini-flash-latest rejects it with
    // 400 INVALID_ARGUMENT. And these models spend HIDDEN "thinking" tokens out
    // of maxOutputTokens, so a small budget returns only a truncated tail of the
    // answer (worse in Arabic, which uses more tokens per character). Give ample
    // headroom and reject anything that still hits the cap.
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  };

  for (const model of GEMINI_CASCADE) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue; // 429 quota / 404 retired model → try the next one
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      };
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();
      // Discard truncated answers (budget exhausted by hidden thinking tokens) —
      // they arrive as a mid-sentence fragment and must never reach a learner.
      if (cand?.finishReason && cand.finishReason !== "STOP") continue;
      // Guard: if the model leaked meta-commentary about its own instructions
      // instead of teaching, discard it and let the next model (or Claude) answer.
      if (text.length >= 40 && !looksLikeMetaLeak(text)) return { reply: text, model };
    } catch {
      clearTimeout(timer);
      // network/abort — try the next model, then fall through to Claude
    }
  }
  return null;
}
