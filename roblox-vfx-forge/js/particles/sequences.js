// Faithful re-implementation of Roblox's NumberSequence / ColorSequence sampling.
// Roblox interpolates LINEARLY between adjacent keypoints, by normalized time t in [0,1].
// First keypoint MUST be at t=0, last at t=1. Times strictly increasing.
//
// A keypoint also carries an "envelope" (random +/- spread). We expose it so the
// preview can jitter values exactly like the engine does.

/** Clamp helper. */
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Sample a NumberSequence-style array of {t, v, e?} keypoints at time t in [0,1].
 * Returns the interpolated value. If withEnvelope is true, applies a random
 * jitter within +/- envelope (matching Roblox's runtime behaviour).
 */
export function sampleNumber(keypoints, t, withEnvelope = false) {
  t = clamp(t, 0, 1);
  if (keypoints.length === 1) return jitter(keypoints[0], withEnvelope);

  for (let i = 0; i < keypoints.length - 1; i++) {
    const a = keypoints[i];
    const b = keypoints[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1e-6;
      const f = (t - a.t) / span;
      const v = lerp(a.v, b.v, f);
      const e = lerp(a.e ?? 0, b.e ?? 0, f);
      return withEnvelope ? v + (Math.random() * 2 - 1) * e : v;
    }
  }
  return jitter(keypoints[keypoints.length - 1], withEnvelope);
}

function jitter(kp, withEnvelope) {
  const e = kp.e ?? 0;
  return withEnvelope ? kp.v + (Math.random() * 2 - 1) * e : kp.v;
}

/**
 * Sample a ColorSequence-style array of {t, c:[r,g,b]} (0-255) at time t in [0,1].
 * Returns [r,g,b] floats in 0-255. Linear RGB interpolation, matching Roblox.
 */
export function sampleColor(keypoints, t) {
  t = clamp(t, 0, 1);
  if (keypoints.length === 1) return keypoints[0].c.slice();

  for (let i = 0; i < keypoints.length - 1; i++) {
    const a = keypoints[i];
    const b = keypoints[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1e-6;
      const f = (t - a.t) / span;
      return [
        lerp(a.c[0], b.c[0], f),
        lerp(a.c[1], b.c[1], f),
        lerp(a.c[2], b.c[2], f),
      ];
    }
  }
  return keypoints[keypoints.length - 1].c.slice();
}

/** NumberRange random pick (uniform), e.g. Lifetime / Speed / Rotation. */
export function pickRange([min, max]) {
  return min + Math.random() * (max - min);
}
