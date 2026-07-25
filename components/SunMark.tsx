"use client";

import { useId } from "react";

/**
 * The wadehAI mark — one circle, one cut, set in daylight.
 * A rising slash (+22°) distinguishes it from the parent studio's setting sun (-22°).
 * The slash is a true transparent cut-out: the surface shows through.
 * Gradient is a single light source — hot point top-right, falling through
 * marigold and coral into oxblood and near-black at the rim.
 */
export function SunMark({ size = 64, className = "" }: { size?: number; className?: string }) {
  const uid = useId();
  const g = `sun-g-${uid}`;
  const m = `sun-m-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={g} cx="68%" cy="26%" r="86%">
          <stop offset="0%" stopColor="#FFF1C8" />
          <stop offset="16%" stopColor="#FFCB58" />
          <stop offset="44%" stopColor="#F2862A" />
          <stop offset="74%" stopColor="#B8341C" />
          <stop offset="92%" stopColor="#5B141A" />
          <stop offset="100%" stopColor="#1A0408" />
        </radialGradient>
        <mask id={m}>
          <rect width="100" height="100" fill="white" />
          <rect x="-30" y="47.35" width="160" height="5.3" fill="black" transform="rotate(22 50 50)" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${g})`} mask={`url(#${m})`} />
    </svg>
  );
}
