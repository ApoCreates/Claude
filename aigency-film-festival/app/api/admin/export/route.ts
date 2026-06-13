import { NextRequest, NextResponse } from "next/server";
import { listSubmissions, summariesFor } from "@/lib/store";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { formatDuration } from "@/lib/utils";

export const runtime = "nodejs";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  if (!isValidToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
  }
  const rows = await listSubmissions();
  const summaries = await summariesFor(rows.map((r) => r.id));

  const header = [
    "title", "slug", "team", "submitter_name", "submitter_email", "duration",
    "cohort", "category", "status", "award", "featured", "votes",
    "jury_overall", "jury_count", "youtube_url", "crew", "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const s = summaries[r.id];
    lines.push(
      [
        r.title, r.slug, r.team_name, r.submitter_name, r.submitter_email, formatDuration(r.duration_seconds),
        r.cohort, r.category || "", r.status, r.award || "", r.featured ? "yes" : "no", r.votes,
        s?.overall ?? 0, s?.count ?? 0, r.youtube_url,
        r.crew.map((m) => `${m.name} (${m.role})`).join("; "), r.created_at,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aigency-festival-submissions.csv"`,
    },
  });
}
