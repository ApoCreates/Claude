import { NextRequest, NextResponse } from "next/server";
import { incrementVote } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const votes = await incrementVote(String(id));
    return NextResponse.json({ votes });
  } catch (e) {
    console.error("[vote]", e);
    return NextResponse.json({ error: "vote failed" }, { status: 500 });
  }
}
