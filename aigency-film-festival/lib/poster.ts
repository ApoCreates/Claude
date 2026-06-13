import { Submission } from "./types";
import { parseYouTube, youtubeThumbnail } from "./youtube";

/** Poster precedence: explicit poster → YouTube still → null (caller draws a fallback). */
export function posterFor(sub: Submission, quality: "max" | "hq" = "hq"): string | null {
  if (sub.poster_url) return sub.poster_url;
  const ref = parseYouTube(sub.youtube_url);
  return ref ? youtubeThumbnail(ref.id, quality) : null;
}
