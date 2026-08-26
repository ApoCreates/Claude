import { NextResponse } from "next/server";
import { tick } from "@/lib/studio/queue";

export const dynamic = "force-dynamic";

/** One scheduler pass. Point a cron at this (Vercel Cron, GitHub Actions, anything)
 *  to make the queue self-driving. Protect it with STUDIO_TICK_SECRET when exposed. */
export async function POST(req: Request) {
  const secret = process.env.STUDIO_TICK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  return NextResponse.json(await tick({ dryRun }));
}

export async function GET(req: Request) { return POST(req); }
