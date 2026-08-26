/** The publishing engine.
 *
 * Two rules are enforced here rather than in the UI, so they hold however the
 * post is triggered:
 *
 *   1. A post whose review verdict is not PASS never publishes. The review desk
 *      gates the queue.
 *   2. A connector without credentials refuses rather than pretending. There is
 *      no silent success anywhere in this path.
 */
import { getConnector, type Platform, type PublishStep } from "./connectors";
import { getPost, listPosts, upsertPost } from "./store";
import type { Post, PostTarget } from "./types";

/** Platforms fetch media from a public URL rather than accepting bytes, so a
 *  stored relative path has to be resolved against this deployment's origin. */
export function publicUrl(p: string): string {
  if (/^https?:\/\//i.test(p)) return p;
  const base =
    process.env.STUDIO_PUBLIC_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
}

export interface PublishOutcome {
  postId: string;
  platform: Platform;
  ok: boolean;
  mode: string;
  error?: string;
  externalId?: string;
  /** The HTTP calls made, or on a dry run the calls that would be made. */
  steps?: PublishStep[];
}

export function isDue(post: Post, at = new Date()): boolean {
  if (!post.scheduledFor) return false;
  return new Date(post.scheduledFor).getTime() <= at.getTime();
}

export function blockedReason(post: Post): string | null {
  if (post.review.verdict === "FAIL") return `Review failed: ${post.review.failures.join("; ") || "see the review note"}`;
  if (post.review.verdict === "NOT_RUN") return "Review has not been run. The gate is not optional.";
  return null;
}

/** Publish one post to one platform. */
export async function publishTarget(
  postId: string, platform: Platform, opts: { dryRun?: boolean } = {}
): Promise<PublishOutcome> {
  const post = await getPost(postId);
  if (!post) return { postId, platform, ok: false, mode: "error", error: "No such post." };

  const blocked = blockedReason(post);
  if (blocked && !opts.dryRun) {
    await setTarget(post, platform, t => { t.status = "blocked"; });
    return { postId, platform, ok: false, mode: "blocked", error: blocked };
  }

  const connector = getConnector(platform);
  if (!connector.capabilities[post.kind]) {
    return { postId, platform, ok: false, mode: "unsupported",
      error: `${connector.name} does not take a ${post.kind} post.` };
  }
  if (post.text.length > connector.limits.captionMax) {
    return { postId, platform, ok: false, mode: "too-long",
      error: `Text is ${post.text.length} characters; ${connector.name} allows ${connector.limits.captionMax}.` };
  }

  if (!opts.dryRun) await setTarget(post, platform, t => { t.status = "publishing"; });

  const result = await connector.publish(
    { text: post.text, mediaUrls: post.mediaUrls.map(publicUrl), kind: post.kind, title: post.title },
    { dryRun: opts.dryRun }
  );

  if (!opts.dryRun) {
    await setTarget(post, platform, t => {
      t.status = result.ok ? "published" : "failed";
      t.result = result;
      t.attemptedAt = new Date().toISOString();
    });
  }

  return {
    postId, platform, ok: result.ok, mode: result.mode,
    error: result.error, externalId: result.externalId, steps: result.steps,
  };
}

async function setTarget(post: Post, platform: Platform, mutate: (t: PostTarget) => void) {
  const fresh = await getPost(post.id);
  if (!fresh) return;
  const t = fresh.targets.find(x => x.platform === platform);
  if (!t) return;
  mutate(t);
  await upsertPost(fresh);
}

/** One scheduler tick: publish everything due that is allowed to go. */
export async function tick(opts: { dryRun?: boolean } = {}): Promise<{
  considered: number; published: PublishOutcome[]; skipped: { postId: string; why: string }[];
}> {
  const posts = await listPosts();
  const published: PublishOutcome[] = [];
  const skipped: { postId: string; why: string }[] = [];
  let considered = 0;

  for (const post of posts) {
    if (!isDue(post)) continue;
    considered++;
    const blocked = blockedReason(post);
    if (blocked) { skipped.push({ postId: post.id, why: blocked }); continue; }
    for (const target of post.targets) {
      if (target.status === "published" || target.status === "publishing") continue;
      published.push(await publishTarget(post.id, target.platform, opts));
    }
  }
  return { considered, published, skipped };
}
