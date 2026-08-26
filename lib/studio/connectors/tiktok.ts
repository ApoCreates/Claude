/** TikTok — Content Posting API, direct post.
 *  Verified against developers.tiktok.com/doc/content-posting-api-reference-direct-post
 *  during this build: init → (PULL_FROM_URL) → status poll. 6 requests/minute per token.
 */
import {
  Connector, PublishPayload, PublishResult, PublishStep,
  envStatus, notConfigured, send, stepFailed,
} from "./types";

const API = "https://open.tiktokapis.com";

const required = [
  { name: "TIKTOK_ACCESS_TOKEN", description: "User access token with the video.publish scope" },
];

export const tiktok: Connector = {
  id: "tiktok",
  name: "TikTok",
  docsUrl: "https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/",
  verified: "primary-docs",
  verifiedNote: "Init endpoint, post_info/source_info fields and rate limit read from TikTok's reference during this build.",
  capabilities: { text: false, image: false, video: true, carousel: false },
  requiredEnv: required,
  limits: { captionMax: 2200, mediaMax: 1, rateLimit: "6 requests per minute per access token" },

  status: () => envStatus(required),

  async publish(payload: PublishPayload, opts): Promise<PublishResult> {
    const st = envStatus(required);
    const dry = opts?.dryRun ?? false;
    if (!st.configured && !dry) return notConfigured("tiktok", st);

    const token = process.env.TIKTOK_ACCESS_TOKEN ?? "<TIKTOK_ACCESS_TOKEN>";
    const videoUrl = payload.mediaUrls?.[0];
    const steps: PublishStep[] = [];

    if (!videoUrl) {
      return { ok: false, platform: "tiktok", mode: dry ? "dry-run" : "live", steps,
        error: "TikTok direct post needs a publicly reachable video URL." };
    }

    const body = {
      post_info: {
        title: payload.text.slice(0, 2200),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
      },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    };
    const headers = {
      Authorization: "Bearer <redacted>",
      "Content-Type": "application/json; charset=UTF-8",
    };
    const step: Omit<PublishStep, "response"> = {
      label: "Initialise direct post", method: "POST",
      url: `${API}/v2/post/publish/video/init/`, headers, body,
    };

    if (dry) {
      steps.push(step as PublishStep);
      steps.push({
        label: "Poll publish status until PUBLISH_COMPLETE", method: "POST",
        url: `${API}/v2/post/publish/status/fetch/`, headers, body: { publish_id: "<publish_id>" },
      });
      return { ok: true, platform: "tiktok", mode: "dry-run", steps };
    }

    const done = await send(step, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(body),
    });
    steps.push(done);
    if (stepFailed(done)) return { ok: false, platform: "tiktok", mode: "live", steps, error: "Init failed." };

    const publishId = String(
      (done.response!.body as { data?: { publish_id?: string } }).data?.publish_id ?? ""
    );
    // The post lands asynchronously; the queue re-checks status rather than blocking here.
    return { ok: true, platform: "tiktok", mode: "live", externalId: publishId, steps };
  },
};
