import { NextResponse } from "next/server";
import { listPosts, newId, upsertPost } from "@/lib/studio/store";
import type { Post } from "@/lib/studio/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ posts: await listPosts() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Post>;
  if (!body.text || !body.title) {
    return NextResponse.json({ error: "title and text are required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const post: Post = {
    id: newId(),
    title: body.title,
    text: body.text,
    kind: body.kind ?? "text",
    mediaUrls: body.mediaUrls ?? [],
    targets: (body.targets ?? []).map(t => ({ platform: t.platform, status: "draft" })),
    scheduledFor: body.scheduledFor ?? null,
    createdAt: now,
    updatedAt: now,
    runSlug: body.runSlug,
    review: body.review ?? { verdict: "NOT_RUN", failures: [] },
  };
  return NextResponse.json({ post: await upsertPost(post) }, { status: 201 });
}
