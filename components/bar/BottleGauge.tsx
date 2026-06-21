"use client";

import { useId } from "react";
import type { Bottle } from "@/lib/bar/bottles";

type Props = {
  bottle: Bottle;
  /** Visible fill fraction (0..1) of the liquid height. */
  fillFraction: number;
  width?: number;
  height?: number;
  className?: string;
};

// Build an SVG path for the full bottle silhouette, mirrored about the centre.
function bottlePath(bottle: Bottle, W: number, H: number, pad: number) {
  const cx = W / 2;
  const maxR = W / 2 - pad;
  const top = pad;
  const bottom = H - pad;
  const yPix = (y: number) => bottom - y * (bottom - top);
  const sil = bottle.silhouette;

  const right: string[] = [];
  const left: string[] = [];
  for (const p of sil) {
    const x = cx + p.r * maxR;
    const xl = cx - p.r * maxR;
    const y = yPix(p.y);
    right.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    left.push(`${xl.toFixed(2)},${y.toFixed(2)}`);
  }
  left.reverse();
  const d = `M ${cx},${bottom.toFixed(2)} L ${right.join(" L ")} L ${left.join(" L ")} Z`;
  return { d, yPix, bottom };
}

export default function BottleGauge({
  bottle,
  fillFraction,
  width = 150,
  height = 320,
  className,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const pad = 10;
  const { d, yPix, bottom } = bottlePath(bottle, width, height, pad);

  // Liquid surface height in the bottle's own coordinates.
  const yLiquid = Math.max(0, Math.min(1, fillFraction)) * bottle.fullY;
  const surfaceY = yPix(yLiquid);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`Bottle showing about ${Math.round(fillFraction * 100)}% liquid`}
    >
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`liq-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bottle.color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={bottle.color} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      {/* Glass body */}
      <path d={d} fill="#0e1318" stroke="#2a3441" strokeWidth="2" />

      {/* Liquid, clipped to the bottle shape */}
      <g clipPath={`url(#clip-${uid})`}>
        <rect
          x={0}
          y={surfaceY}
          width={width}
          height={bottom - surfaceY}
          fill={`url(#liq-${uid})`}
        />
        {/* Surface highlight */}
        <rect x={0} y={surfaceY} width={width} height={2.5} fill="#ffffff" opacity={0.35} />
        {/* Glass sheen overlay */}
        <rect x={0} y={0} width={width} height={height} fill={`url(#glass-${uid})`} />
      </g>

      {/* Outline on top so it stays crisp */}
      <path d={d} fill="none" stroke="#3a4654" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
