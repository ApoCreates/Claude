import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { addInsights, getBrain } from "@/lib/brain/store";
import { todayISO } from "@/lib/utils";
import { logAgentRun } from "@/lib/diwan/db";
import { newId } from "@/lib/store/persist";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily self-research. Vercel Cron hits this endpoint every morning
 * (see vercel.json); it can also be triggered manually from the Brain
 * panel. The agent researches current writing/campaign/newsroom best
 * practices with web search, distills them into insights, and stores
 * them in its brain — from where they flow into every system prompt.
 */

const RESEARCH_PROMPT = `You are the research half of Qalam, a bilingual (Arabic/English) master writer agent covering copywriting, campaigns, fiction, documentary, screenwriting, prompt engineering, comedy, and newsroom editing.

Research what changed RECENTLY (last few weeks) in:
1. Copywriting & social platform best practices (formats, hook styles, algorithm shifts)
2. Arabic-language content trends across the Gulf, Egypt, and the Levant (dialect usage, platforms, campaigns people talk about)
3. Advertising campaign craft (award winners, notable launches, what worked)
4. Newsroom / editorial standards and formats
5. Prompt-engineering techniques for the latest text/image/video models
6. What now reads as "AI-written" to audiences — so the agent can avoid it

Use web search to ground yourself. Then respond with ONLY a JSON array (no prose, no code fences) of 5 to 8 insights:
[{"topic": "short area tag", "text": "one imperative, practice-ready insight a writer can apply today"}]
Insights must be specific and actionable — a craft rule, not a news summary.`;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function runResearch(): Promise<Response> {
  if (!hasLiveAI()) {
    return Response.json({
      ok: true,
      mode: "demo",
      added: 0,
      message: "Demo mode — set ANTHROPIC_API_KEY to enable live self-research.",
      insights: (await getBrain()).insights,
    });
  }

  const runId = newId("run");
  const started = Date.now();
  const client = getClient();
  const res = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2400,
    messages: [{ role: "user", content: RESEARCH_PROMPT }],
    // Server-side web search tool — lets the agent read today's web.
    // Dynamic-filtering web search (Sonnet 4.6+): results are filtered
    // before they reach the context window — fewer wasted input tokens.
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 4,
      } as never,
    ],
  });

  const researchText = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  void logAgentRun({
    id: runId,
    requestType: "research",
    input: { kind: "daily-self-research" },
    output: researchText,
    status: "ok",
    model: DEFAULT_MODEL,
    tokens: res.usage,
    latencyMs: Date.now() - started,
  });
  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return Response.json(
      { ok: false, error: "Research returned no parseable insights", raw: text.slice(0, 500) },
      { status: 502 }
    );
  }

  let parsed: { topic?: string; text?: string }[];
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json({ ok: false, error: "Insight JSON failed to parse" }, { status: 502 });
  }

  const date = todayISO();
  const added = await addInsights(
    parsed
      .filter((p) => p.text)
      .slice(0, 8)
      .map((p) => ({ date, topic: p.topic || "general", text: p.text as string }))
  );

  return Response.json({ ok: true, mode: "live", added: added.length, insights: added });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runResearch();
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runResearch();
}
