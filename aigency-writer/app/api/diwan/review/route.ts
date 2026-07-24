import { NextRequest } from "next/server";
import { addLesson } from "@/lib/brain/store";
import { diwanEnabled, listReviewQueue, resolveReview } from "@/lib/diwan/db";

export const runtime = "nodejs";

/** GET → the human review queue (all 1–2★ outputs, auto-flagged). */
export async function GET() {
  if (!diwanEnabled()) return Response.json({ enabled: false, queue: [] });
  return Response.json({ enabled: true, queue: await listReviewQueue() });
}

interface ResolveBody {
  id: string;
  action: "prompt_update" | "knowledge_update" | "guardrail" | "no_action";
  note?: string;
  /** For prompt_update / guardrail: the human-authored amendment text */
  patchText?: string;
  resolvedBy?: string;
}

/**
 * Human-in-the-loop resolution. Automation drafts, humans approve:
 * (a) prompt_update → versioned prompt amendment (prompt_patches)
 * (b) knowledge_update → permanent lesson in the agent's brain
 * (c) guardrail → guardrail rule appended to the prompt
 * (d) no_action → user error / no change, logged for traceability
 */
export async function POST(req: NextRequest) {
  if (!diwanEnabled()) return Response.json({ error: "Diwan not configured" }, { status: 400 });
  let body: ResolveBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id || !body.action) {
    return Response.json({ error: "id and action required" }, { status: 400 });
  }
  if ((body.action === "prompt_update" || body.action === "guardrail") && !body.patchText?.trim()) {
    return Response.json({ error: "patchText required for this action" }, { status: 400 });
  }

  if (body.action === "knowledge_update" && body.patchText?.trim()) {
    const lang = /[؀-ۿ]/.test(body.patchText) ? "ar" : "en";
    await addLesson({ source: "coaching", lang, text: body.patchText.trim() });
  }

  const ok = await resolveReview({
    id: body.id,
    action: body.action,
    note: body.note,
    patchText: body.patchText?.trim(),
    resolvedBy: body.resolvedBy,
  });
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: "Resolve failed" }, { status: 502 });
}
