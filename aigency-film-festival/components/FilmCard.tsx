import Link from "next/link";
import { Submission } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { posterFor } from "@/lib/poster";

export function FilmCard({ sub, score }: { sub: Submission; score?: number }) {
  const poster = posterFor(sub, "hq");
  return (
    <Link
      href={`/film/${sub.slug}`}
      className="group relative flex flex-col overflow-hidden border border-on/12 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-on/25"
    >
      <div className="relative aspect-video overflow-hidden bg-surface2">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={`${sub.title} — poster`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" style={{ background: "var(--plasma)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
        {sub.award && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-surface/85 px-3 py-1 font-mono text-[9px] uppercase tracking-label text-gold backdrop-blur">
            ✦ {sub.award}
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded bg-surface/80 px-2 py-1 font-mono text-[10px] tracking-wide text-on/80 backdrop-blur">
          {formatDuration(sub.duration_seconds)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-2xl leading-tight text-on" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}>
          {sub.title}
        </h3>
        <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed text-on/55">{sub.logline}</p>
        <div className="mt-auto flex items-center justify-between pt-4 font-mono text-[10px] uppercase tracking-label text-on/40">
          <span>{sub.team_name}</span>
          <span className="flex items-center gap-3">
            {typeof score === "number" && score > 0 && <span className="text-gold">{score.toFixed(1)}</span>}
            <span>♥ {sub.votes}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
