import { parseYouTube, youtubeEmbedUrl } from "@/lib/youtube";
import { cx } from "@/lib/utils";

/**
 * Responsive privacy-enhanced YouTube player. Standard links render 16:9;
 * Shorts links render a centred 9:16 frame (the vertical format from the course).
 */
export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const ref = parseYouTube(url);
  if (!ref) {
    return (
      <div className="flex aspect-video items-center justify-center border border-on/15 bg-card font-mono text-xs uppercase tracking-label text-on/40">
        Film link unavailable
      </div>
    );
  }
  const vertical = ref.kind === "short";
  return (
    <div className={cx("mx-auto w-full", vertical && "max-w-[420px]")}>
      <div
        className="relative w-full overflow-hidden border border-on/15 bg-black"
        style={{ aspectRatio: vertical ? "9 / 16" : "16 / 9" }}
      >
        <iframe
          src={youtubeEmbedUrl(ref)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
