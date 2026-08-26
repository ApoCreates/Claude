import { NextResponse } from "next/server";
import { deletePost, getPost, upsertPost } from "@/lib/studio/store";
import type { Post } from "@/lib/studio/types";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = (await req.json()) as Partial<Post>;
  const next: Post = { ...post, ...patch, id: post.id, createdAt: post.createdAt };
  return NextResponse.json({ post: await upsertPost(next) });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = await deletePost(params.id);
  return NextResponse.json({ deleted: ok }, { status: ok ? 200 : 404 });
}
