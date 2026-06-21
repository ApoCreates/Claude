import { POSTER_BUCKET, storeMode } from "./store";
import { shortId, slugify } from "./utils";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function storageConfigured(): boolean {
  return storeMode() === "supabase";
}

/**
 * Upload a poster to the Supabase Storage bucket and return its public URL.
 * Returns null when storage isn't configured (caller falls back to a URL field
 * or the YouTube thumbnail).
 */
export async function uploadPoster(file: File): Promise<string | null> {
  if (!storageConfigured()) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "poster";
  const path = `${Date.now()}-${shortId(5)}-${base}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${POSTER_BUCKET}/${encodeURIComponent(path)}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buf,
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.warn(`[storage] upload failed ${res.status}: ${await res.text().catch(() => "")}`);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${POSTER_BUCKET}/${path}`;
}
