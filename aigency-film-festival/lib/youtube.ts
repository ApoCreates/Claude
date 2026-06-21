export type YouTubeRef = {
  id: string;
  /** "short" = vertical 9:16 (YouTube Shorts), "video" = standard 16:9. */
  kind: "short" | "video";
};

/**
 * Parse any common YouTube URL into a video id. Handles watch?v=, youtu.be/,
 * /shorts/, /embed/, and bare 11-char ids.
 */
export function parseYouTube(input: string): YouTubeRef | null {
  if (!input) return null;
  const url = input.trim();

  // bare id
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { id: url, kind: "video" };

  let kind: "short" | "video" = "video";
  let id: string | null = null;

  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2];
        kind = "short";
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2];
      } else {
        id = u.searchParams.get("v");
      }
    }
  } catch {
    return null;
  }

  if (id) id = id.split(/[?&/]/)[0];
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return { id, kind };
  return null;
}

export function youtubeEmbedUrl(ref: YouTubeRef): string {
  return `https://www.youtube-nocookie.com/embed/${ref.id}?rel=0&modestbranding=1`;
}

export function youtubeWatchUrl(ref: YouTubeRef): string {
  return `https://youtu.be/${ref.id}`;
}

/** Best-effort still. maxres isn't guaranteed; hqdefault always exists. */
export function youtubeThumbnail(id: string, quality: "max" | "hq" = "max"): string {
  return `https://i.ytimg.com/vi/${id}/${quality === "max" ? "maxresdefault" : "hqdefault"}.jpg`;
}
