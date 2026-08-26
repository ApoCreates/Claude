/** YouTube — Data API v3 resumable video upload.
 *  NOT re-verified in this build: written from prior knowledge. Check the resumable
 *  upload flow and scopes against current docs before going live.
 */
import {
  Connector, PublishPayload, PublishResult, PublishStep,
  envStatus, notConfigured, send, stepFailed,
} from "./types";

const required = [
  { name: "YOUTUBE_CLIENT_ID", description: "OAuth client ID" },
  { name: "YOUTUBE_CLIENT_SECRET", description: "OAuth client secret" },
  { name: "YOUTUBE_REFRESH_TOKEN", description: "Refresh token with youtube.upload scope" },
];

async function accessToken(): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
    client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN ?? "",
    grant_type: "refresh_token",
  });
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch { return null; }
}

export const youtube: Connector = {
  id: "youtube",
  name: "YouTube",
  docsUrl: "https://developers.google.com/youtube/v3/docs/videos/insert",
  verified: "unverified",
  verifiedNote: "Written from prior knowledge and NOT re-checked against the docs in this build. Verify the resumable upload flow and quota cost before connecting a live account.",
  capabilities: { text: false, image: false, video: true, carousel: false },
  requiredEnv: required,
  limits: { captionMax: 5000, mediaMax: 1, rateLimit: "An upload costs ~1600 quota units of a default 10,000/day" },

  status: () => envStatus(required),

  async publish(payload: PublishPayload, opts): Promise<PublishResult> {
    const st = envStatus(required);
    const dry = opts?.dryRun ?? false;
    if (!st.configured && !dry) return notConfigured("youtube", st);

    const videoUrl = payload.mediaUrls?.[0];
    const steps: PublishStep[] = [];
    if (!videoUrl) {
      return { ok: false, platform: "youtube", mode: dry ? "dry-run" : "live", steps,
        error: "YouTube needs a video URL." };
    }

    const metadata = {
      snippet: {
        title: (payload.title ?? payload.text.split("\n")[0]).slice(0, 100),
        description: payload.text.slice(0, 5000),
      },
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
    };
    const initStep: Omit<PublishStep, "response"> = {
      label: "Start resumable upload", method: "POST",
      url: "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      headers: { Authorization: "Bearer <redacted>", "Content-Type": "application/json" },
      body: metadata,
    };

    if (dry) {
      steps.push({ label: "Exchange refresh token for an access token", method: "POST",
        url: "https://oauth2.googleapis.com/token", body: { grant_type: "refresh_token", refresh_token: "<redacted>" } });
      steps.push(initStep as PublishStep);
      steps.push({ label: "PUT video bytes to the Location URL returned by the init call",
        method: "PUT", url: "<resumable session URL>", body: "<binary video>" });
      return { ok: true, platform: "youtube", mode: "dry-run", steps };
    }

    const token = await accessToken();
    if (!token) return { ok: false, platform: "youtube", mode: "live", steps,
      error: "Could not exchange the refresh token for an access token." };

    const done = await send(initStep, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });
    steps.push(done);
    if (stepFailed(done)) return { ok: false, platform: "youtube", mode: "live", steps, error: "Resumable init failed." };

    return { ok: false, platform: "youtube", mode: "live", steps,
      error: "Resumable byte upload is not implemented in this build. The session initialises; streaming the video to the Location URL is the remaining step." };
  },
};
