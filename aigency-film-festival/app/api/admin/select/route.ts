import { NextRequest, NextResponse } from "next/server";
import { updateSubmission } from "@/lib/store";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isValidToken(req.cookies.get(ADMIN_COOKIE)?.value))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id, featured } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const row = await updateSubmission(String(id), { featured: !!featured });
    return NextResponse.json({ ok: true, featured: row?.featured ?? !!featured });
  } catch (e) {
    console.error("[admin/select]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
