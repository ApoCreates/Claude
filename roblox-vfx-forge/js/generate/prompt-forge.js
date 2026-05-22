// Prompt-driven parametric model generator.
//
// Honest design ("steal like an artist" = trend-INFORMED original generation,
// not copying anyone's assets): a free-text prompt is interpreted into a
// structured weapon spec using a curated trend library + keyword rules. The
// same prompt is expanded into a richer "enhanced prompt" shown to the user.
// Deterministic + seedable, so variations / recreate are reproducible.
//
// Pure module (no THREE / no DOM) so it is fully unit-testable. The produced
// spec is a Weapon Forge params object, reused by the existing generator.

import { defaultWeapon, WEAPON_STYLES, applyStyle } from "../weapon/forge.js";

// Seedable RNG (mulberry32) so a (prompt, seed) pair is reproducible.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Curated current-Roblox style trends. Each contributes palette + material +
// proportion/glow nudges. This is the maintained, compliant alternative to
// scraping creator accounts.
export const TRENDS = {
  anime:      { keywords: ["anime", "demon", "slayer", "ronin", "samurai"], style: "Katana", blade: [235, 240, 245], glow: [255, 70, 90], material: "Metal", grip: [120, 20, 30] },
  cyberpunk:  { keywords: ["cyber", "cyberpunk", "neon", "tron", "hologram", "techno"], style: "Neon Blade", blade: [120, 200, 255], glow: [0, 255, 200], material: "Neon", grip: [20, 25, 40] },
  fantasy:    { keywords: ["fantasy", "magic", "enchanted", "elven", "rune", "wizard", "mythic"], style: "Longsword", blade: [210, 225, 255], glow: [150, 110, 255], material: "Metal", grip: [60, 40, 80] },
  fire:       { keywords: ["fire", "flame", "lava", "infernal", "ember", "magma", "hell"], style: "Greatsword", blade: [255, 180, 90], glow: [255, 80, 20], material: "Neon", grip: [40, 20, 10] },
  ice:        { keywords: ["ice", "frost", "frozen", "glacial", "winter", "crystal"], style: "Longsword", blade: [200, 240, 255], glow: [120, 200, 255], material: "Glass", grip: [40, 70, 110] },
  gold:       { keywords: ["gold", "golden", "royal", "luxury", "king", "divine", "holy"], style: "Longsword", blade: [255, 215, 120], glow: [255, 240, 160], material: "Metal", grip: [90, 60, 20] },
  shadow:     { keywords: ["shadow", "void", "dark", "cursed", "death", "reaper", "demonic"], style: "Greatsword", blade: [60, 60, 75], glow: [150, 40, 200], material: "Metal", grip: [20, 20, 25] },
  pastel:     { keywords: ["pastel", "kawaii", "cute", "candy", "pink", "soft"], style: "Dagger", blade: [255, 200, 230], glow: [255, 150, 200], material: "SmoothPlastic", grip: [200, 160, 220] },
};

// item type -> Weapon Forge style
const TYPE_TO_STYLE = {
  katana: "Katana", dagger: "Dagger", knife: "Dagger", shortsword: "Dagger",
  greatsword: "Greatsword", claymore: "Greatsword", broadsword: "Greatsword",
  longsword: "Longsword", sword: "Longsword", blade: "Longsword", saber: "Katana",
};

const COLOR_WORDS = {
  red: [230, 50, 50], crimson: [200, 30, 40], blue: [60, 120, 255], cyan: [40, 220, 255],
  green: [60, 220, 110], lime: [160, 255, 80], purple: [160, 80, 255], violet: [150, 90, 255],
  pink: [255, 120, 200], orange: [255, 150, 40], yellow: [255, 230, 70], gold: [255, 215, 120],
  white: [240, 245, 255], black: [40, 40, 48], silver: [200, 205, 215], teal: [40, 200, 190],
};

const MATERIAL_WORDS = {
  neon: "Neon", glowing: "Neon", glow: "Neon", energy: "Neon",
  glass: "Glass", crystal: "Glass", ice: "Glass",
  metal: "Metal", steel: "Metal", iron: "Metal", chrome: "Metal", gold: "Metal",
  plastic: "SmoothPlastic", marble: "Marble",
};

const SIZE_WORDS = {
  huge: 1.5, giant: 1.6, massive: 1.7, big: 1.25, large: 1.3, long: 1.25,
  small: 0.7, tiny: 0.55, short: 0.75, slim: 0.85, thin: 0.8, broad: 1.2, wide: 1.2,
};

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * Interpret a prompt into { spec, enhancedPrompt, detected }.
 * `spec` is a Weapon Forge params object.
 */
export function parsePrompt(prompt) {
  const words = tokenize(prompt);
  const wordSet = new Set(words);
  const detected = { type: null, trend: null, colors: [], material: null, sizeMul: 1 };

  // trend (first matching)
  for (const [name, t] of Object.entries(TRENDS)) {
    if (t.keywords.some((k) => wordSet.has(k))) { detected.trend = name; break; }
  }
  // type
  for (const w of words) if (TYPE_TO_STYLE[w]) { detected.type = w; break; }
  // colors
  for (const w of words) if (COLOR_WORDS[w]) detected.colors.push(w);
  // material
  for (const w of words) if (MATERIAL_WORDS[w]) { detected.material = w; break; }
  // size multiplier (product of size words, clamped)
  for (const w of words) if (SIZE_WORDS[w]) detected.sizeMul *= SIZE_WORDS[w];
  detected.sizeMul = Math.max(0.5, Math.min(2, detected.sizeMul));

  // resolve style: explicit type wins, else trend's style, else Longsword
  const trend = detected.trend ? TRENDS[detected.trend] : null;
  const style = detected.type ? TYPE_TO_STYLE[detected.type] : trend ? trend.style : "Longsword";

  let spec = applyStyle({}, style);

  // apply trend palette/material as a base
  if (trend) {
    spec.bladeColor = trend.blade.slice();
    spec.glowColor = trend.glow.slice();
    spec.gripColor = trend.grip.slice();
    spec.bladeMaterial = trend.material;
  }
  // explicit material overrides
  if (detected.material) spec.bladeMaterial = MATERIAL_WORDS[detected.material];
  // explicit colors: 1st -> blade, 2nd -> glow
  if (detected.colors[0]) spec.bladeColor = COLOR_WORDS[detected.colors[0]].slice();
  if (detected.colors[1]) spec.glowColor = COLOR_WORDS[detected.colors[1]].slice();
  // size
  spec.bladeLength = round2(spec.bladeLength * detected.sizeMul);
  if (detected.sizeMul > 1.1) spec.bladeWidth = round2(spec.bladeWidth * (1 + (detected.sizeMul - 1) * 0.5));

  spec.style = style;
  spec.prompt = prompt;

  return { spec, enhancedPrompt: enhancePrompt(prompt, detected, style, spec), detected };
}

// Build a richer prompt string from what we understood (shown to the user).
export function enhancePrompt(prompt, detected, style, spec) {
  const bits = [];
  bits.push(`A game-ready ${style.toLowerCase()}`);
  if (detected.trend) bits.push(`${detected.trend} aesthetic`);
  const matWord = { Neon: "glowing neon", Glass: "translucent crystal", Metal: "polished metal", SmoothPlastic: "smooth", Marble: "marble" }[spec.bladeMaterial] || spec.bladeMaterial.toLowerCase();
  bits.push(`forged from ${matWord} material`);
  bits.push(`blade tinted rgb(${spec.bladeColor.join(",")}) with rgb(${spec.glowColor.join(",")}) energy accents`);
  if (detected.sizeMul > 1.1) bits.push("oversized, heavy proportions");
  else if (detected.sizeMul < 0.9) bits.push("compact, lightweight proportions");
  else bits.push("balanced proportions");
  bits.push("clean stylized silhouette suited to Roblox, single welded model");
  return bits.join(", ") + ".";
}

/**
 * Generate N reproducible variations of a base spec. Each variation jitters
 * proportions / hue / material within tasteful bounds.
 */
export function makeVariations(baseSpec, prompt, count = 6) {
  const out = [];
  const baseSeed = hashString(prompt || baseSpec.style || "x");
  for (let i = 0; i < count; i++) {
    const r = rng(baseSeed + i * 7919);
    const v = JSON.parse(JSON.stringify(baseSpec));
    const jl = 0.8 + r() * 0.5;        // 0.8 .. 1.3
    const jw = 0.85 + r() * 0.4;
    v.bladeLength = round2(clampNum(v.bladeLength * jl, 1, 9));
    v.bladeWidth = round2(clampNum(v.bladeWidth * jw, 0.2, 1.6));
    v.bladeTaper = round2(clampNum(0.2 + r() * 0.7, 0.1, 1));
    v.fuller = r() > 0.4;
    v.bladeColor = jitterColor(v.bladeColor, r, 18);
    v.glowColor = jitterColor(v.glowColor, r, 30);
    if (r() > 0.75) v.bladeMaterial = r() > 0.5 ? "Neon" : "Metal";
    v.guardWidth = round2(clampNum(v.guardWidth * (0.85 + r() * 0.4), 0.4, 2.6));
    v.variation = i + 1;
    out.push(v);
  }
  return out;
}

function jitterColor(rgb, r, amt) {
  return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c + (r() * 2 - 1) * amt))));
}
function clampNum(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function round2(x) { return Math.round(x * 100) / 100; }
