import { NextRequest, NextResponse } from "next/server";
import { addRating } from "@/lib/store";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  return isValidToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

const clamp = (n: unknown) => Math.max(1, Math.min(10, Math.round(Number(n) || 0)));

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const submission_id = String(b.submission_id || "");
    if (!submission_id) return NextResponse.json({ error: "submission_id required" }, { status: 400 });
    const rating = await addRating({
      submission_id,
      juror: (String(b.juror || "Jury").trim() || "Jury").slice(0, 60),
      story: clamp(b.story),
      craft: clamp(b.craft),
      ai: clamp(b.ai),
      emotion: clamp(b.emotion),
      notes: b.notes ? String(b.notes).trim().slice(0, 400) : null,
    });
    return NextResponse.json({ ok: true, rating });
  } catch (e) {
    console.error("[ratings]", e);
    return NextResponse.json({ error: "rating failed" }, { status: 500 });
  }
}
