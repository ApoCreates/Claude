import { NextRequest } from "next/server";
import { getClient, hasLiveAI, UTILITY_MODEL } from "@/lib/ai/client";
import { addInsights, getBrain } from "@/lib/brain/store";
import { todayISO } from "@/lib/utils";
import { EST_RESEARCH_RUN_USD, RESEARCH_MONTHLY_BUDGET_USD } from "@/lib/costs";
import { logAgentRun } from "@/lib/diwan/db";
import { getMonthSpendByType } from "@/lib/spend";
import { newId } from "@/lib/store/persist";

/**
 * Research runs on Haiku: distilling search results into one-line craft
 * insights doesn't need Sonnet, and it costs ~3–5× less — which is what
 * lets research stay DAILY inside the hard monthly budget.
 */
const RESEARCH_MODEL = process.env.ANTHROPIC_RESEARCH_MODEL || UTILITY_MODEL;

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

  // HARD BUDGET GUARD — cron and manual triggers alike. If this run
  // could push month-to-date research spend past the cap, skip it and
  // say so; never silently burn credit.
  const spentThisMonth = await getMonthSpendByType("research");
  if (spentThisMonth + EST_RESEARCH_RUN_USD > RESEARCH_MONTHLY_BUDGET_USD) {
    console.log(
      `[research] skipped — monthly budget reached ($${spentThisMonth.toFixed(2)} of $${RESEARCH_MONTHLY_BUDGET_USD})`
    );
    return Response.json({
      ok: true,
      skipped: "monthly-research-budget",
      spentUsd: Math.round(spentThisMonth * 100) / 100,
      budgetUsd: RESEARCH_MONTHLY_BUDGET_USD,
      message: "Research paused until next month — the monthly research budget is used up.",
    });
  }

  const runId = newId("run");
  const started = Date.now();
  const client = getClient();
  const res = await client.messages.create({
    model: RESEARCH_MODEL,
    max_tokens: 1600,
    messages: [{ role: "user", content: RESEARCH_PROMPT }],
    // Server-side web search: 3 searches balance freshness vs cost —
    // search-result content bills as input tokens, which is also why
    // this runs on Haiku.
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      } as never,
    ],
  });

  const researchText = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  await logAgentRun({
    id: runId,
    requestType: "research",
    input: { kind: "daily-self-research" },
    output: researchText,
    status: "ok",
    model: RESEARCH_MODEL,
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
