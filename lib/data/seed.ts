// Seeded pseudo-random generator so the demo dataset is stable across reloads.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function jitter(rng: () => number, base: number, pct: number) {
  return base * (1 + (rng() - 0.5) * 2 * pct);
}
