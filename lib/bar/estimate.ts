import type { Bottle, ShapePoint } from "./bottles";

const SHOT_ML = 44.36; // 1.5 US fl oz, a standard pour

export function clamp(n: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Interpolated relative radius of the silhouette at height y (0..1). */
export function radiusAt(sil: ShapePoint[], y: number): number {
  if (y <= sil[0].y) return sil[0].r;
  const last = sil[sil.length - 1];
  if (y >= last.y) return last.r;
  for (let i = 1; i < sil.length; i++) {
    if (y <= sil[i].y) {
      const a = sil[i - 1];
      const b = sil[i];
      const span = b.y - a.y || 1e-9;
      const t = (y - a.y) / span;
      return a.r + t * (b.r - a.r);
    }
  }
  return last.r;
}

/** Relative volume (π∫r²dy) from the base up to height yTop. */
export function volumeUpTo(sil: ShapePoint[], yTop: number, steps = 600): number {
  if (yTop <= 0) return 0;
  const dy = yTop / steps;
  let v = 0;
  for (let i = 0; i < steps; i++) {
    const y = (i + 0.5) * dy;
    const r = radiusAt(sil, y);
    v += Math.PI * r * r * dy;
  }
  return v;
}

/**
 * Convert a visible fill fraction (height of liquid from the base to the
 * surface, as a fraction of the full-line height) into a fraction of the
 * bottle's total volume — accounting for the bottle's tapering shape.
 */
export function volumeFractionFromFill(bottle: Bottle, fillFraction: number): number {
  const f = clamp(fillFraction);
  const yLiquid = f * bottle.fullY;
  const vLiquid = volumeUpTo(bottle.silhouette, yLiquid);
  const vFull = volumeUpTo(bottle.silhouette, bottle.fullY);
  return vFull > 0 ? clamp(vLiquid / vFull) : f;
}

export type Estimate = {
  fillFraction: number; // 0..1 visible liquid height
  volumeFraction: number; // 0..1 of total capacity
  remainingMl: number;
  shots: number;
};

export function estimate(bottle: Bottle, fillFraction: number, volumeMl?: number): Estimate {
  const vol = volumeMl ?? bottle.volumeMl;
  const volumeFraction = volumeFractionFromFill(bottle, fillFraction);
  const remainingMl = volumeFraction * vol;
  return {
    fillFraction: clamp(fillFraction),
    volumeFraction,
    remainingMl,
    shots: remainingMl / SHOT_ML,
  };
}

export function fmtMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(2)} L`;
  return `${Math.round(ml)} ml`;
}

export function fmtPct(frac: number): string {
  return `${Math.round(clamp(frac) * 100)}%`;
}

export function levelTone(frac: number): "good" | "warn" | "bad" {
  if (frac >= 0.35) return "good";
  if (frac >= 0.15) return "warn";
  return "bad";
}
