import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TutorRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  subject: string;
  subjectName: string;
  levelTitle: string;
  level: number;
  lang: "en" | "ar";
  region: "gcc" | "levant" | null;
}

const REGION_LABEL = {
  gcc: "the GCC (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman)",
  levant: "the Levant (Jordan, Lebanon, Palestine, Syria)",
};

function systemPrompt(req: TutorRequest): string {
  const regionText = req.region ? REGION_LABEL[req.region] : "the Arab world";
  const langText =
    req.lang === "ar"
      ? "Respond in Modern Standard Arabic (اللغة العربية الفصحى), clear and warm. You may quote English technical terms in parentheses when useful."
      : "Respond in clear, warm English. You may add the Arabic term in parentheses when it helps a bilingual learner.";
  return [
    "You are the wadehAI tutor — patient, encouraging, and Socratic. wadehAI (واضح, 'clear') is a bilingual learning platform for young people in the Arab world.",
    `The learner is currently on: subject "${req.subjectName}" (${req.subject}), level ${req.level} of 10 — "${req.levelTitle}".`,
    `The learner lives in ${regionText}. Whenever an example, analogy or word problem is possible, draw it from that region's daily life, landmarks, history or economy.`,
    langText,
    "Rules: never mock a question. Never rush. Never just hand over the final answer to an exercise — guide with steps and questions so the learner reaches it. Keep answers under 200 words unless walking through a multi-step problem. If asked something inappropriate for a young learner or unrelated to learning, gently redirect to the lesson.",
  ].join("\n\n");
}

// Canned fallback — makes the whole product demoable with no API key.
function cannedReply(req: TutorRequest): string {
  const q = req.messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
  if (req.lang === "ar") {
    return [
      `سؤال جميل. لنفكر فيه معاً ضمن درس «${req.levelTitle}».`,
      `أولاً: ما الذي تعرفه مسبقاً عن هذا الموضوع؟ حاول صياغة «${q.slice(0, 60)}» بكلماتك الخاصة.`,
      "ثانياً: قسّم السؤال إلى جزأين أصغر، وابدأ بالجزء الذي تشعر أنه أسهل.",
      "ثالثاً: جرّب حلاً — حتى لو لم تكن متأكداً — وأخبرني بما توصلت إليه لنراجعه خطوة بخطوة.",
      "(هذا وضع تجريبي دون اتصال — أضف ANTHROPIC_API_KEY لتفعيل المعلّم الحي.)",
    ].join("\n\n");
  }
  return [
    `Good question. Let's think it through inside “${req.levelTitle}”.`,
    `First: what do you already know here? Try restating “${q.slice(0, 60)}” in your own words.`,
    "Second: split the question into two smaller parts and start with the easier one.",
    "Third: attempt an answer — even an unsure one — and tell me what you got, so we can check it step by step.",
    "(Canned offline mode — set ANTHROPIC_API_KEY to enable the live tutor.)",
  ].join("\n\n");
}

export async function POST(request: Request) {
  const req = (await request.json()) as TutorRequest;

  if (!Array.isArray(req.messages) || req.messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: cannedReply(req), live: false });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: systemPrompt(req),
      messages: req.messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    });
    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ reply, live: true });
  } catch {
    // Any API failure degrades gracefully to canned mode.
    return NextResponse.json({ reply: cannedReply(req), live: false });
  }
}
