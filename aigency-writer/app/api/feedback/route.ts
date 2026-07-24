import { NextRequest } from "next/server";
import { getClient, hasLiveAI, UTILITY_MODEL } from "@/lib/ai/client";
import { buildLessonDistillPrompt } from "@/lib/ai/persona";
import { addFeedback, addLesson } from "@/lib/brain/store";
import { logAgentRun, recordFeedback } from "@/lib/diwan/db";
import { newId } from "@/lib/store/persist";
import type { LessonSource } from "@/lib/brain/types";

export const runtime = "nodejs";

interface FeedbackBody {
  mode: string;
  rating: "up" | "down";
  /** Diwan 1–5 star rating (preferred; rating up/down kept for compat) */
  stars?: number;
  runId?: string;
  clientId?: string;
  comment?: string;
  excerpt?: string;
  /** "feedback" from the Studio, "training" from the Gym */
  source?: LessonSource;
}

/**
 * Feedback is the agent's teacher. Every submission is recorded; when a
 * comment carries an actionable correction it is distilled (via Claude)
 * into a one-line imperative lesson and added to the brain, where it is
 * injected into every future system prompt.
 */
export async function POST(req: NextRequest) {
  let body: FeedbackBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.rating !== "up" && body.rating !== "down") {
    return Response.json({ error: "rating must be 'up' or 'down'" }, { status: 400 });
  }

  await addFeedback({
    mode: body.mode || "unknown",
    rating: body.rating,
    comment: body.comment,
    excerpt: body.excerpt?.slice(0, 2000),
  });

  // Diwan feedback capture: stars + free text, tied to the run
  void recordFeedback({
    outputId: body.runId || "unknown",
    rating: body.stars ?? (body.rating === "up" ? 5 : 2),
    feedbackText: body.comment,
    clientId: body.clientId,
    requestType: body.mode,
    promptResponse: body.excerpt ? { excerpt: body.excerpt.slice(0, 2000) } : undefined,
  });

  const comment = body.comment?.trim();
  if (!comment) {
    return Response.json({ ok: true, lesson: null });
  }

  const source: LessonSource = body.source === "training" ? "training" : "feedback";

  // Without a key, store the coach's words verbatim — still a real lesson.
  if (!hasLiveAI()) {
    const lang = /[؀-ۿ]/.test(comment) ? "ar" : "en";
    const lesson = await addLesson({ source, lang, text: comment });
    return Response.json({ ok: true, lesson, distilled: false });
  }

  try {
    const client = getClient();
    const started = Date.now();
    const res = await client.messages.create({
      model: UTILITY_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: buildLessonDistillPrompt({
            mode: body.mode || "unknown",
            rating: body.rating,
            comment,
            excerpt: body.excerpt,
          }),
        },
      ],
    });
    void logAgentRun({
      id: newId("run"),
      requestType: "distill",
      clientId: body.clientId,
      input: { mode: body.mode, rating: body.rating },
      status: "ok",
      model: UTILITY_MODEL,
      tokens: res.usage,
      latencyMs: Date.now() - started,
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    if (text === "NONE" || !text) {
      return Response.json({ ok: true, lesson: null });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const lang = /[؀-ۿ]/.test(comment) ? "ar" : "en";
      const lesson = await addLesson({ source, lang, text: comment });
      return Response.json({ ok: true, lesson, distilled: false });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { lang?: string; lesson?: string };
    const lang = parsed.lang === "ar" || parsed.lang === "en" || parsed.lang === "both" ? parsed.lang : "both";
    if (!parsed.lesson) return Response.json({ ok: true, lesson: null });

    const lesson = await addLesson({ source, lang, text: parsed.lesson });
    return Response.json({ ok: true, lesson, distilled: true });
  } catch {
    const lang = /[؀-ۿ]/.test(comment) ? "ar" : "en";
    const lesson = await addLesson({ source, lang, text: comment });
    return Response.json({ ok: true, lesson, distilled: false });
  }
}
