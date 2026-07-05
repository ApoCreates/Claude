import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/persona";
import { buildDailyPlan } from "@/lib/training/scenarios";
import { demoDrillResponse } from "@/lib/ai/demo";
import { todayISO } from "@/lib/utils";
import type { BrandProfile } from "@/lib/profiles";

export const runtime = "nodejs";
export const maxDuration = 120;

/** GET → today's deterministic ~30-minute practice plan (3 AR + 3 EN drills). */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayISO();
  return Response.json(buildDailyPlan(date));
}

interface RunDrillBody {
  drillId: string;
  date?: string;
  profile?: BrandProfile | null;
}

/** POST → the agent performs one drill from the plan (streamed). */
export async function POST(req: NextRequest) {
  let body: RunDrillBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = buildDailyPlan(body.date || todayISO());
  const drill = plan.drills.find((d) => d.id === body.drillId);
  if (!drill) {
    return Response.json({ error: "Unknown drill for that date" }, { status: 404 });
  }

  if (!hasLiveAI()) {
    return new Response(demoDrillResponse(drill.lang), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Mode": "demo" },
    });
  }

  const system = buildSystemPrompt({
    mode: drill.mode,
    profile: body.profile,
    outputLang: drill.lang,
    extra: `TRAINING GYM SESSION
This is a timed practice drill (${drill.minutes} minutes), not client work. Perform the task at full professional quality, then add a 2–3 line self-review: name one thing you did deliberately and one thing a tough coach might challenge. Your coach will review this and correct you — corrections become permanent rules.`,
  });

  const client = getClient();
  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 3000,
    system,
    messages: [{ role: "user", content: drill.task }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => {
        controller.enqueue(
          encoder.encode(`\n\n[Drill error: ${err instanceof Error ? err.message : "unknown"}]`)
        );
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Mode": "live" },
  });
}
