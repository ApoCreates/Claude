import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { buildLessonDistillPrompt } from "@/lib/ai/persona";
import { addFeedback, addLesson } from "@/lib/brain/store";
import type { LessonSource } from "@/lib/brain/types";

export const runtime = "nodejs";

interface FeedbackBody {
  mode: string;
  rating: "up" | "down";
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

  addFeedback({
    mode: body.mode || "unknown",
    rating: body.rating,
    comment: body.comment,
    excerpt: body.excerpt?.slice(0, 2000),
  });

  const comment = body.comment?.trim();
  if (!comment) {
    return Response.json({ ok: true, lesson: null });
  }

  const source: LessonSource = body.source === "training" ? "training" : "feedback";

  // Without a key, store the coach's words verbatim — still a real lesson.
  if (!hasLiveAI()) {
    const lang = /[؀-ۿ]/.test(comment) ? "ar" : "en";
    const lesson = addLesson({ source, lang, text: comment });
    return Response.json({ ok: true, lesson, distilled: false });
  }

  try {
    const client = getClient();
    const res = await client.messages.create({
      model: DEFAULT_MODEL,
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
      const lesson = addLesson({ source, lang, text: comment });
      return Response.json({ ok: true, lesson, distilled: false });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { lang?: string; lesson?: string };
    const lang = parsed.lang === "ar" || parsed.lang === "en" || parsed.lang === "both" ? parsed.lang : "both";
    if (!parsed.lesson) return Response.json({ ok: true, lesson: null });

    const lesson = addLesson({ source, lang, text: parsed.lesson });
    return Response.json({ ok: true, lesson, distilled: true });
  } catch {
    const lang = /[؀-ۿ]/.test(comment) ? "ar" : "en";
    const lesson = addLesson({ source, lang, text: comment });
    return Response.json({ ok: true, lesson, distilled: false });
  }
}
