import { NextRequest, NextResponse } from "next/server";
import { updateSubmission } from "@/lib/store";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { SubmissionStatus } from "@/lib/types";

export const runtime = "nodejs";

const STATUSES: SubmissionStatus[] = ["submitted", "selected", "awarded"];

export async function POST(req: NextRequest) {
  if (!isValidToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id, award, status } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const patch: { award: string | null; status?: SubmissionStatus } = {
      award: award ? String(award).trim().slice(0, 80) : null,
    };
    if (status && STATUSES.includes(status)) patch.status = status;
    else if (award) patch.status = "awarded";
    const row = await updateSubmission(String(id), patch);
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[admin/award]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
