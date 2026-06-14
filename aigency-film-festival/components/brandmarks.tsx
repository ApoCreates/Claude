import { cx } from "@/lib/utils";
import { FESTIVAL } from "@/lib/brand";

/**
 * The slashed sun — the only icon in the system. A round plasma disc cut by a
 * bar in the surface colour at −22°. "No horizon line. The cut is the horizon."
 */
export function Mark({
  size = 120,
  glow = false,
  slash = "#15140F",
  className,
}: {
  size?: number;
  glow?: boolean;
  slash?: string;
  className?: string;
}) {
  return (
    <span
      className={cx("relative inline-block align-middle", className)}
      style={{ width: size, maxWidth: "100%", aspectRatio: "1 / 1" }}
      aria-hidden="true"
    >
      {glow && (
        <span
          className="pointer-events-none absolute"
          style={{
            inset: "-14%",
            background: "radial-gradient(42% 38% at 78% 26%, rgba(255,203,88,0.38), transparent 70%)",
            filter: "blur(26px)",
          }}
        />
      )}
      <svg viewBox="0 0 200 200" width="100%" height="100%" className="relative block overflow-visible">
        <defs>
          <radialGradient id="aff-plasma" cx="0.72" cy="0.28" r="0.9">
            <stop offset="0%" stopColor="#FFF4D0" />
            <stop offset="8%" stopColor="#FFCB58" />
            <stop offset="30%" stopColor="#F2862A" />
            <stop offset="58%" stopColor="#DC4A1E" />
            <stop offset="82%" stopColor="#8E1F18" />
            <stop offset="100%" stopColor="#3A0A0C" />
          </radialGradient>
          <clipPath id="aff-disc">
            <circle cx="100" cy="100" r="98" />
          </clipPath>
        </defs>
        <g clipPath="url(#aff-disc)">
          <circle cx="100" cy="100" r="98" fill="url(#aff-plasma)" />
          <g transform="rotate(-22 100 100)">
            <rect x="-4" y="94" width="208" height="11.5" fill={slash} />
          </g>
        </g>
      </svg>
    </span>
  );
}

/** The wordmark: italic "The" + roman "Aigency". Never all-caps, never another face. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("font-serif leading-none", className)} style={{ letterSpacing: "-0.02em" }}>
      <span style={{ fontStyle: "italic", fontWeight: 400, marginRight: "0.16em" }}>The</span>
      <span style={{ fontWeight: 500 }}>Aigency</span>
    </span>
  );
}

/** Icon + wordmark, side by side. The default form anywhere a viewer arrives. */
export function Lockup({
  size = 34,
  slash = "#15140F",
  className,
  wordClassName,
}: {
  size?: number;
  slash?: string;
  className?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cx("inline-flex items-center", className)} style={{ gap: size * 0.42 }}>
      <Mark size={size} slash={slash} />
      <Wordmark className={cx("text-on", wordClassName)} />
    </span>
  );
}

/**
 * The festival sign — the lockup with the service line beneath, as the user
 * asked: the logo placed under "Capacity Building & Empowerment".
 */
export function FestivalLockup({
  size = 40,
  slash = "#15140F",
  className,
}: {
  size?: number;
  slash?: string;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex flex-col gap-3", className)}>
      <Lockup size={size} slash={slash} />
      <span className="font-mono text-[10px] uppercase tracking-label text-on/45">
        {FESTIVAL.service}
      </span>
    </span>
  );
}

/** The grand prize, rendered with glamour: a luminous slashed sun on a plinth. */
export function PrizeSun({ size = 240, slash = "#15140F" }: { size?: number; slash?: string }) {
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div
        className="pointer-events-none absolute -z-10"
        style={{
          inset: "-30%",
          background: "radial-gradient(46% 42% at 70% 34%, rgba(255,203,88,0.42), rgba(242,134,42,0.10) 46%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="animate-floaty">
        <Mark size={size} glow slash={slash} />
      </div>
      {/* plinth line */}
      <div
        className="mt-6 h-[2px] w-3/4 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(217,162,74,0.7), transparent)" }}
      />
      <div
        className="mt-3 h-10 w-1/2 rounded-[50%] opacity-30 blur-md"
        style={{ background: "radial-gradient(closest-side, rgba(217,162,74,0.5), transparent)" }}
        aria-hidden
      />
    </div>
  );
}
