import { NextResponse } from "next/server";
import { getPost, upsertPost } from "@/lib/studio/store";
import { reviewPost } from "@/lib/studio/review";

export const dynamic = "force-dynamic";

/** POST { postId } — runs gate 1 on the copy and records the verdict on the post.
 *  This is what clears a post for publishing; nothing else sets the verdict. */
export async function POST(req: Request) {
  const { postId } = (await req.json()) as { postId?: string };
  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });
  const post = await getPost(postId);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { verdict, findings } = reviewPost(post);
  post.review = {
    verdict,
    failures: findings.filter(f => f.severity === "fail").map(f => `${f.rule}: ${f.detail}`),
    checkedAt: new Date().toISOString(),
  };
  await upsertPost(post);
  return NextResponse.json({ postId, verdict, findings });
}
