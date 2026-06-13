import { NextRequest, NextResponse } from "next/server";
import { createSubmission } from "@/lib/store";
import { sendSubmissionEmails } from "@/lib/email";
import { parseYouTube } from "@/lib/youtube";
import { isEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const logline = String(body.logline || "").trim();
    const youtube_url = String(body.youtube_url || "").trim();
    const duration_seconds = Math.round(Number(body.duration_seconds)) || 0;
    const team_name = String(body.team_name || "").trim();
    const submitter_name = String(body.submitter_name || "").trim();
    const submitter_email = String(body.submitter_email || "").trim();
    const crew = Array.isArray(body.crew)
      ? body.crew
          .filter((m: unknown) => m && typeof m === "object" && String((m as { name?: string }).name || "").trim())
          .map((m: { name: string; role?: string }) => ({
            name: String(m.name).trim().slice(0, 80),
            role: String(m.role || "Crew").trim().slice(0, 60) || "Crew",
          }))
      : [];
    const ai_tools = String(body.ai_tools || "").trim().slice(0, 400);
    const ai_disclosure = String(body.ai_disclosure || "").trim().slice(0, 400);
    const cohort = (String(body.cohort || "").trim() || "Edition I").slice(0, 120);
    const category = body.category ? String(body.category).trim().slice(0, 60) : null;
    const poster_url = body.poster_url ? String(body.poster_url).trim().slice(0, 600) : null;

    if (!title || !logline) return NextResponse.json({ error: "Title and logline are required." }, { status: 400 });
    if (!parseYouTube(youtube_url)) return NextResponse.json({ error: "A valid YouTube link is required." }, { status: 400 });
    if (duration_seconds <= 0) return NextResponse.json({ error: "Duration is required." }, { status: 400 });
    if (!team_name) return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    if (!submitter_name || !isEmail(submitter_email))
      return NextResponse.json({ error: "A valid name and email are required." }, { status: 400 });
    if (!crew.length) return NextResponse.json({ error: "At least one crew member is required." }, { status: 400 });

    const sub = await createSubmission({
      title: title.slice(0, 160),
      logline: logline.slice(0, 280),
      youtube_url,
      duration_seconds,
      poster_url,
      team_name: team_name.slice(0, 120),
      submitter_name: submitter_name.slice(0, 120),
      submitter_email,
      crew,
      ai_tools,
      ai_disclosure,
      cohort,
      category,
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
    const filmUrl = `${base}/film/${sub.slug}`;
    const email = await sendSubmissionEmails(sub, filmUrl).catch(() => ({
      organiser: false,
      confirmation: false,
      configured: false,
    }));

    return NextResponse.json({ slug: sub.slug, id: sub.id, email });
  } catch (e) {
    console.error("[submissions]", e);
    return NextResponse.json({ error: "Could not save your submission. Please try again." }, { status: 500 });
  }
}
