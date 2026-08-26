/** X — API v2 tweet creation.
 *  NOT re-verified in this build: written from prior knowledge of the v2 endpoints.
 *  Check POST /2/tweets and the media upload host against current docs before going live.
 */
import {
  Connector, PublishPayload, PublishResult, PublishStep,
  envStatus, notConfigured, send, stepFailed,
} from "./types";

const required = [
  { name: "X_ACCESS_TOKEN", description: "OAuth 2.0 user-context token with tweet.write" },
];

export const x: Connector = {
  id: "x",
  name: "X",
  docsUrl: "https://docs.x.com/x-api/posts/creation-of-a-post",
  verified: "unverified",
  verifiedNote: "Written from prior knowledge and NOT re-checked against the docs in this build. Verify the endpoint and media upload host before connecting a live account.",
  capabilities: { text: true, image: true, video: true, carousel: false },
  requiredEnv: required,
  limits: { captionMax: 280, mediaMax: 4, rateLimit: "Per-tier post caps; check your access level" },

  status: () => envStatus(required),

  async publish(payload: PublishPayload, opts): Promise<PublishResult> {
    const st = envStatus(required);
    const dry = opts?.dryRun ?? false;
    if (!st.configured && !dry) return notConfigured("x", st);

    const token = process.env.X_ACCESS_TOKEN ?? "<X_ACCESS_TOKEN>";
    const steps: PublishStep[] = [];
    const headers = { Authorization: "Bearer <redacted>", "Content-Type": "application/json" };

    if (payload.text.length > 280) {
      return { ok: false, platform: "x", mode: dry ? "dry-run" : "live", steps,
        error: `Text is ${payload.text.length} characters; the limit is 280.` };
    }

    if (payload.mediaUrls?.length) {
      steps.push({ label: "Upload media (v1.1 upload host) and collect media_ids", method: "POST",
        url: "https://upload.twitter.com/1.1/media/upload.json", body: "<binary media>" });
    }

    const body: Record<string, unknown> = { text: payload.text };
    if (payload.mediaUrls?.length) body.media = { media_ids: ["<media_id>"] };

    const step: Omit<PublishStep, "response"> = {
      label: "Create post", method: "POST", url: "https://api.x.com/2/tweets", headers, body,
    };
    if (dry) {
      steps.push(step as PublishStep);
      return { ok: true, platform: "x", mode: "dry-run", steps };
    }
    if (payload.mediaUrls?.length) {
      return { ok: false, platform: "x", mode: "live", steps,
        error: "Media upload for X is not implemented in this build — text-only posts publish; attach no media, or implement the v1.1 upload step first." };
    }
    const done = await send(step, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload.text }),
    });
    steps.push(done);
    if (stepFailed(done)) return { ok: false, platform: "x", mode: "live", steps, error: "Post creation failed." };
    const id = String((done.response!.body as { data?: { id?: string } }).data?.id ?? "");
    return { ok: true, platform: "x", mode: "live", externalId: id,
      url: id ? `https://x.com/i/status/${id}` : undefined, steps };
  },
};
