import { NextResponse } from "next/server";
import { completeText, hasLiveAI } from "@/lib/ai/client";
import { SCENARIO_SYSTEM, businessContext } from "@/lib/ai/prompts";

const CANNED =
  "Plausible 6–12 month revenue impact: +6% to +11% on the affected line, with downside risk of –3% if competitors respond aggressively.\n\nTop drivers: (1) elasticity-driven volume lift in the target channel, (2) cannibalization of adjacent SKUs in the same category, (3) shelf reallocation by retail partners. Net effect depends heavily on whether two key banner partners hold pricing.\n\nTop risks: aggressive competitor counter-promotion within an 8-week window, and slotting/operational drag that delays realization by a quarter.\n\nRecommendation: pilot in 3–5 banners across two regions for an 8-week period before national rollout; pre-negotiate counter-promo terms with top-3 banner partners; instrument scan-data dashboards so the program can be killed within 30 days if elasticity assumptions don't hold.";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }
  if (!hasLiveAI()) {
    return NextResponse.json({ live: false, text: CANNED });
  }
  try {
    const text = await completeText({
      system: SCENARIO_SYSTEM,
      user: `Scenario question: ${question}\n\nBUSINESS CONTEXT:\n${businessContext()}`,
      maxTokens: 700,
    });
    return NextResponse.json({ live: true, text: text || CANNED });
  } catch (e: any) {
    return NextResponse.json({ live: false, text: `AI error: ${e.message}\n\n${CANNED}` });
  }
}
