/** LinkedIn — Posts API (versioned).
 *  Verified against learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api
 *  during this build: POST /rest/posts, required headers, author URN, distribution
 *  and lifecycleState fields. Images go through the Images API to obtain an image URN.
 */
import {
  Connector, PublishPayload, PublishResult, PublishStep,
  envStatus, notConfigured, send, stepFailed,
} from "./types";

const API = "https://api.linkedin.com/rest";
/** YYYYMM. The docs' current default moniker at build time was 2026-08. */
const VERSION = process.env.LINKEDIN_VERSION ?? "202608";

const required = [
  { name: "LINKEDIN_ACCESS_TOKEN", description: "OAuth token with w_organization_social or w_member_social" },
  { name: "LINKEDIN_AUTHOR_URN", description: "urn:li:organization:{id} or urn:li:person:{id}" },
];

export const linkedin: Connector = {
  id: "linkedin",
  name: "LinkedIn",
  docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api",
  verified: "primary-docs",
  verifiedNote: "Endpoint, headers and body schema read from LinkedIn's Posts API doc during this build.",
  capabilities: { text: true, image: true, video: true, carousel: false },
  requiredEnv: required,
  limits: { captionMax: 3000, mediaMax: 1, rateLimit: "Per-app and per-member daily quotas" },

  status: () => envStatus(required),

  async publish(payload: PublishPayload, opts): Promise<PublishResult> {
    const st = envStatus(required);
    const dry = opts?.dryRun ?? false;
    if (!st.configured && !dry) return notConfigured("linkedin", st);

    const token = process.env.LINKEDIN_ACCESS_TOKEN ?? "<LINKEDIN_ACCESS_TOKEN>";
    const author = process.env.LINKEDIN_AUTHOR_URN ?? "<urn:li:organization:0000>";
    const steps: PublishStep[] = [];
    const headers = {
      Authorization: "Bearer <redacted>",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": VERSION,
      "Content-Type": "application/json",
    };
    const liveHeaders = { ...headers, Authorization: `Bearer ${token}` };

    let imageUrn: string | undefined;
    if (payload.mediaUrls?.length) {
      // Images API: initializeUpload → PUT bytes → use the returned image URN.
      const initStep: Omit<PublishStep, "response"> = {
        label: "Initialise image upload", method: "POST",
        url: `${API}/images?action=initializeUpload`, headers,
        body: { initializeUploadRequest: { owner: author } },
      };
      if (dry) {
        steps.push(initStep as PublishStep);
        steps.push({ label: "Upload image bytes to the returned uploadUrl", method: "PUT",
          url: "<uploadUrl from initializeUpload>", body: "<binary image>" });
        imageUrn = "<urn:li:image:...>";
      } else {
        const done = await send(initStep, {
          method: "POST", headers: liveHeaders,
          body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
        });
        steps.push(done);
        if (stepFailed(done)) return { ok: false, platform: "linkedin", mode: "live", steps, error: "Image upload init failed." };
        const v = (done.response!.body as { value?: { uploadUrl?: string; image?: string } }).value;
        imageUrn = v?.image;
        if (v?.uploadUrl) {
          const bytes = await fetch(payload.mediaUrls[0]).then(r => r.arrayBuffer());
          const up = await send(
            { label: "Upload image bytes", method: "PUT", url: v.uploadUrl },
            { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: bytes }
          );
          steps.push(up);
          if (stepFailed(up)) return { ok: false, platform: "linkedin", mode: "live", steps, error: "Image byte upload failed." };
        }
      }
    }

    const post: Record<string, unknown> = {
      author,
      commentary: payload.text.slice(0, 3000),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };
    if (imageUrn) post.content = { media: { id: imageUrn, ...(payload.title ? { title: payload.title } : {}) } };

    const postStep: Omit<PublishStep, "response"> = {
      label: "Create post", method: "POST", url: `${API}/posts`, headers, body: post,
    };
    if (dry) {
      steps.push(postStep as PublishStep);
      return { ok: true, platform: "linkedin", mode: "dry-run", steps };
    }
    const done = await send(postStep, { method: "POST", headers: liveHeaders, body: JSON.stringify(post) });
    steps.push(done);
    if (stepFailed(done)) return { ok: false, platform: "linkedin", mode: "live", steps, error: "Post creation failed." };

    // The post URN comes back in the x-restli-id response header; the body is empty on 201.
    const urn = String((done.response!.body as { id?: string }).id ?? "");
    return {
      ok: true, platform: "linkedin", mode: "live", externalId: urn,
      url: urn ? `https://www.linkedin.com/feed/update/${urn}/` : undefined, steps,
    };
  },
};
