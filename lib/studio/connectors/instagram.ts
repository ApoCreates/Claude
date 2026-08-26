/** Instagram — Content Publishing API.
 *  Verified against developers.facebook.com/docs/instagram-platform/content-publishing
 *  during this build: two-step container → publish, carousel via children,
 *  100 API-published posts per rolling 24h. JPEG is the only supported image format.
 */
import {
  Connector, PublishPayload, PublishResult, PublishStep,
  envStatus, notConfigured, send, stepFailed,
} from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

const required = [
  { name: "IG_USER_ID", description: "Instagram professional account ID (the IG User ID, not the page ID)" },
  { name: "IG_ACCESS_TOKEN", description: "Long-lived access token with instagram_content_publish" },
];

export const instagram: Connector = {
  id: "instagram",
  name: "Instagram",
  docsUrl: "https://developers.facebook.com/docs/instagram-platform/content-publishing",
  verified: "primary-docs",
  verifiedNote: "Endpoints and parameters read from Meta's publishing guide during this build.",
  capabilities: { text: false, image: true, video: true, carousel: true },
  requiredEnv: required,
  limits: { captionMax: 2200, mediaMax: 10, rateLimit: "100 API-published posts per rolling 24 hours" },

  status: () => envStatus(required),

  async publish(payload: PublishPayload, opts): Promise<PublishResult> {
    const st = envStatus(required);
    const dry = opts?.dryRun ?? false;
    if (!st.configured && !dry) return notConfigured("instagram", st);

    const id = process.env.IG_USER_ID ?? "<IG_USER_ID>";
    const token = process.env.IG_ACCESS_TOKEN ?? "<IG_ACCESS_TOKEN>";
    const media = payload.mediaUrls ?? [];
    const steps: PublishStep[] = [];

    if (media.length === 0) {
      return { ok: false, platform: "instagram", mode: dry ? "dry-run" : "live", steps,
        error: "Instagram has no text-only post. Attach at least one image or video." };
    }
    if (media.length > 10) {
      return { ok: false, platform: "instagram", mode: dry ? "dry-run" : "live", steps,
        error: "Carousels are limited to 10 items." };
    }

    const isCarousel = media.length > 1;
    const containerFor = (url: string, asChild: boolean) => {
      const p = new URLSearchParams();
      const isVideo = /\.(mp4|mov|m4v)(\?|$)/i.test(url);
      if (isVideo) { p.set("video_url", url); p.set("media_type", payload.kind === "video" ? "REELS" : "VIDEO"); }
      else p.set("image_url", url);
      if (asChild) p.set("is_carousel_item", "true");
      else p.set("caption", payload.text.slice(0, 2200));
      p.set("access_token", token);
      return p;
    };

    // 1 · one container per item
    const childIds: string[] = [];
    for (const [i, url] of media.entries()) {
      const body = containerFor(url, isCarousel);
      const step: Omit<PublishStep, "response"> = {
        label: isCarousel ? `Create carousel item ${i + 1}/${media.length}` : "Create media container",
        method: "POST", url: `${GRAPH}/${id}/media`,
        body: Object.fromEntries([...body].map(([k, v]) => [k, k === "access_token" ? "<redacted>" : v])),
      };
      if (dry) { steps.push(step as PublishStep); childIds.push(`<container_${i + 1}>`); continue; }
      const done = await send(step, { method: "POST", body });
      steps.push(done);
      if (stepFailed(done)) return { ok: false, platform: "instagram", mode: "live", steps,
        error: `Container creation failed at item ${i + 1}.` };
      childIds.push(String((done.response!.body as { id?: string }).id ?? ""));
    }

    // 2 · carousel parent
    let creationId = childIds[0];
    if (isCarousel) {
      const body = new URLSearchParams({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption: payload.text.slice(0, 2200),
        access_token: token,
      });
      const step: Omit<PublishStep, "response"> = {
        label: "Create carousel container", method: "POST", url: `${GRAPH}/${id}/media`,
        body: { media_type: "CAROUSEL", children: childIds.join(","), caption: payload.text.slice(0, 2200), access_token: "<redacted>" },
      };
      if (dry) { steps.push(step as PublishStep); creationId = "<carousel_container>"; }
      else {
        const done = await send(step, { method: "POST", body });
        steps.push(done);
        if (stepFailed(done)) return { ok: false, platform: "instagram", mode: "live", steps, error: "Carousel container failed." };
        creationId = String((done.response!.body as { id?: string }).id ?? "");
      }
    }

    // 3 · publish
    const pubBody = new URLSearchParams({ creation_id: creationId, access_token: token });
    const pubStep: Omit<PublishStep, "response"> = {
      label: "Publish", method: "POST", url: `${GRAPH}/${id}/media_publish`,
      body: { creation_id: creationId, access_token: "<redacted>" },
    };
    if (dry) {
      steps.push(pubStep as PublishStep);
      return { ok: true, platform: "instagram", mode: "dry-run", steps };
    }
    const done = await send(pubStep, { method: "POST", body: pubBody });
    steps.push(done);
    if (stepFailed(done)) return { ok: false, platform: "instagram", mode: "live", steps, error: "Publish failed." };

    const mediaId = String((done.response!.body as { id?: string }).id ?? "");
    return { ok: true, platform: "instagram", mode: "live", externalId: mediaId, steps };
  },
};
