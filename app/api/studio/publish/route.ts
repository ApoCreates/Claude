import { NextResponse } from "next/server";
import { publishTarget } from "@/lib/studio/queue";
import type { Platform } from "@/lib/studio/types";

export const dynamic = "force-dynamic";

/** POST { postId, platform, dryRun? }
 *  dryRun returns the exact requests the connector would send, without sending them. */
export async function POST(req: Request) {
  const { postId, platform, dryRun } = (await req.json()) as
    { postId?: string; platform?: Platform; dryRun?: boolean };
  if (!postId || !platform) {
    return NextResponse.json({ error: "postId and platform are required" }, { status: 400 });
  }
  const outcome = await publishTarget(postId, platform, { dryRun: Boolean(dryRun) });
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 409 });
}
