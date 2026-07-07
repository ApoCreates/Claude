import { NextRequest } from "next/server";
import { exportBrainAsCode, getBrain } from "@/lib/brain/store";

export const runtime = "nodejs";

/**
 * GET → the agent's current brain (lessons + insights + feedback log).
 * GET ?export=code → the brain rendered as lib/brain/seed.ts, ready to
 * commit — this is how runtime learning gets baked into the shipped code.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("export") === "code") {
    return new Response(await exportBrainAsCode(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="seed.ts"',
      },
    });
  }
  const brain = await getBrain();
  return Response.json({
    lessons: brain.lessons,
    insights: brain.insights,
    feedback: brain.feedback.slice(-30),
    lastResearchAt: brain.lastResearchAt,
    live: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
