/**
 * The Aigency — brand + festival constants.
 * Voice: quiet authority, terrain & light metaphors, first-person plural.
 * Marks: the wordmark ("The" italic + "Aigency") and the slashed sun.
 */

export const BRAND = {
  name: "The Aigency",
  tagline: "AI for the better.",
  domain: "ai-gency.ai",
  contactEmail: "lab@ai-gency.ai",
  // Palette (from the v.2 brand guide + web token set).
  color: {
    surface: "#15140F",
    paper: "#F4EFE5",
    accent: "#FFCB58",
    accent2: "#F2862A",
    ochre: "#C4612A",
    gold: "#D9A24A",
    dusk: "#8B2E1F",
    mute: "#6E685D",
  },
} as const;

export const FESTIVAL = {
  name: "The Aigency Film Festival",
  short: "Film Festival",
  /** The service this sits under — shown beneath the lockup. */
  service: "Capacity Building & Empowerment",
  tagline: "Films made for the years ahead.",
  // Reusable across trainings — set NEXT_PUBLIC_FESTIVAL_EDITION per cohort.
  edition: process.env.NEXT_PUBLIC_FESTIVAL_EDITION || "Edition I · 2026",
} as const;

/** The grand prize — inspired directly by the slashed-sun mark. */
export const GRAND_PRIZE = {
  name: "The Slashed Sun",
  line: "The festival's highest honour. One film, for the cut that becomes a horizon.",
} as const;

/** Category honours awarded by the jury. */
export const AWARDS: { name: string; note: string }[] = [
  { name: "The Slashed Sun", note: "Best Film — the grand prize." },
  { name: "The Horizon", note: "Best Story — the idea you remember a week later." },
  { name: "First Light", note: "Best Use of AI — craft that earns the tool." },
  { name: "Golden Hour", note: "Best Craft — picture and sound in service of the work." },
  { name: "The People's Sun", note: "Audience Favourite — decided by the room." },
];

/** Jury rating criteria (1–10 each). Drawn from the Day-2 method. */
export const RATING_CRITERIA = [
  { key: "story", label: "Story & Idea", hint: "A reason to care. Clear logline, a real turn." },
  { key: "craft", label: "Craft", hint: "Picture and sound. Consistency across shots." },
  { key: "ai", label: "Use of AI", hint: "Designed toward the tool's strengths. Not a slot machine." },
  { key: "emotion", label: "Emotion", hint: "The single feeling the last frame leaves behind." },
] as const;

export type CriterionKey = (typeof RATING_CRITERIA)[number]["key"];

/** Optional submission categories. */
export const CATEGORIES = [
  "Narrative",
  "Documentary / Factual",
  "Experimental",
  "Social / Vertical",
] as const;

/** The festival arc — echoes the workshop's idea → build → submit shape. */
export const ARC: { num: string; kicker: string; title: string; body: string }[] = [
  {
    num: "01",
    kicker: "Begin",
    title: "Build the idea",
    body: "One sentence. One feeling. The thing no model can supply.",
  },
  {
    num: "02",
    kicker: "Ground",
    title: "Make the film",
    body: "Sixty to ninety seconds, with sound. A consistency kit, a shotlist, a rough cut.",
  },
  {
    num: "03",
    kicker: "Submit",
    title: "Publish the page",
    body: "Title, poster, crew. The portal turns your entry into its own page, at once.",
  },
  {
    num: "04",
    kicker: "Last",
    title: "Screen & honour",
    body: "We watch together. The jury weighs the work. The light lands on a few.",
  },
];

/** Public base URL, for absolute links in emails. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
