import { listPosts } from "@/lib/studio/store";
import { blockedReason } from "@/lib/studio/queue";
import { getConnector } from "@/lib/studio/connectors";
import QueueActions from "@/components/studio/QueueActions";
import TickButton from "@/components/studio/TickButton";
import Composer from "@/components/studio/Composer";
import ReviewButton from "@/components/studio/ReviewButton";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const posts = await listPosts();
  return (
    <>
      <p className="s-eyebrow">Queue</p>
      <h1 className="s-h1">What is waiting to go out.</h1>
      <p className="s-lede">
        A dry run returns the exact HTTP calls the connector would make, without sending
        them — the payload can be read before any account is connected. Publish is the
        real call, and it refuses when the credentials are absent or the review desk has
        not passed the post.
      </p>

      <div className="s-section">
        <div className="s-section-hd"><h2 className="s-h2">Compose</h2></div>
        <Composer />
      </div>

      <div className="s-section">
        <div className="s-section-hd"><h2 className="s-h2">Scheduler</h2></div>
        <TickButton />
        <p className="s-note">
          One tick publishes everything due that is cleared. A Vercel cron runs it
          daily at 06:00 UTC — Vercel&rsquo;s Hobby plan allows one cron run per day, so
          anything finer needs the Pro plan or an external scheduler. Any cron can drive
          <code> POST /api/studio/tick</code>; set <code>STUDIO_TICK_SECRET</code> and
          send it as a bearer token when you expose it.
        </p>
      </div>

      {posts.map(post => {
        const why = blockedReason(post);
        return (
          <section className="s-section" key={post.id}>
            <div className="s-section-hd">
              <h2 className="s-h2">{post.title}</h2>
              <span className="s-mono">
                {post.scheduledFor ? new Date(post.scheduledFor).toUTCString().slice(5, 22) : "unscheduled"}
              </span>
            </div>
            <div className="s-card plain">
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{post.text}</p>
              <div className="s-caps">
                <span className="s-tag mute">{post.kind}</span>
                {post.runSlug && <span className="s-tag mute">run: {post.runSlug}</span>}
                {why ? <span className="s-tag bad">{why}</span> : <span className="s-tag ok">review passed</span>}
                {post.review.checkedAt && (
                  <span className="s-tag mute">checked {new Date(post.review.checkedAt).toUTCString().slice(5, 17)}</span>
                )}
              </div>
              <div style={{ marginTop: 12 }}><ReviewButton postId={post.id} /></div>
            </div>

            {post.targets.map(t => {
              const c = getConnector(t.platform);
              const s = c.status();
              const stopped = Boolean(why) || !s.configured;
              const reason = why
                ? "held by review"
                : !s.configured ? `set ${s.missing.join(", ")}` : undefined;
              return (
                <div className="s-row" key={t.platform}>
                  <div className="t">
                    <b>{c.name}</b>
                    <span>
                      {t.status}
                      {t.result?.error ? ` — ${t.result.error}` : ""}
                      {c.verified === "unverified" ? " · endpoints unverified in this build" : ""}
                    </span>
                  </div>
                  <QueueActions
                    postId={post.id}
                    platform={t.platform}
                    disabled={stopped}
                    disabledReason={reason}
                  />
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
