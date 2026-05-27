export type ProductAttribute = { label: string; value: string };
export type ImageSuggestion = { shot: string; purpose: string };

export type ProductSeo = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  altText: string;
};

export type ProductAnalysis = {
  name: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  brand: string | null;
  tags: string[];
  attributes: ProductAttribute[];
  seo: ProductSeo;
  imageSuggestions: ImageSuggestion[];
  confidence: number;
};

export const PRODUCT_SYSTEM = `You are a product cataloging and e-commerce SEO specialist.
You receive a single product photo and must produce a complete, publish-ready listing.

Return ONLY a JSON object — no markdown fences, no commentary — matching this exact shape:
{
  "name": string,                 // concise human product name
  "title": string,                // marketplace listing title, <= 70 chars, keyword-rich, no ALL CAPS
  "shortDescription": string,     // 1-2 sentence summary
  "description": string,          // 2-4 short paragraphs of persuasive but accurate copy, separated by \\n\\n
  "category": string,             // category path, e.g. "Footwear > Sneakers"
  "brand": string | null,         // brand only if visible/identifiable, else null
  "tags": string[],               // 8-15 lowercase search/filter tags
  "attributes": [ { "label": string, "value": string } ], // 5-10 observable metadata pairs (color, material, style, key features)
  "seo": {
    "metaTitle": string,          // <= 60 chars
    "metaDescription": string,    // <= 155 chars
    "keywords": string[],         // 6-12 keywords
    "slug": string,               // kebab-case url slug
    "altText": string             // descriptive alt text for the hero image
  },
  "imageSuggestions": [ { "shot": string, "purpose": string } ], // 4-6 additional shots to complete the gallery
  "confidence": number            // 0-1, confidence in the identification
}

Rules:
- Be accurate. Only describe what is reasonably observable in the photo.
- Do NOT fabricate exact specifics (dimensions, weight, model numbers) unless clearly visible — generalize instead.
- If the brand is not clearly identifiable, set "brand" to null and keep the title brand-agnostic.
- Keep copy clean and professional; avoid hype words that imply unverifiable claims.`;

export function buildUserPrompt(opts: { hint?: string; marketplace?: string }): string {
  const lines: string[] = [];
  if (opts.marketplace?.trim()) lines.push(`Target marketplace / channel: ${opts.marketplace.trim()}.`);
  if (opts.hint?.trim()) lines.push(`Seller hint (use only if consistent with the image): ${opts.hint.trim()}.`);
  lines.push("Analyze the attached product image and return the listing JSON.");
  return lines.join("\n");
}

/** Pull a JSON object out of a model response that may be fenced or padded with prose. */
export function parseAnalysis(raw: string): ProductAnalysis {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }
  const obj = JSON.parse(text.slice(start, end + 1));
  return normalizeAnalysis(obj);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function normalizeAnalysis(o: any): ProductAnalysis {
  const seo = o?.seo ?? {};
  return {
    name: asString(o?.name, "Untitled product"),
    title: asString(o?.title, asString(o?.name, "Untitled product")),
    shortDescription: asString(o?.shortDescription),
    description: asString(o?.description),
    category: asString(o?.category, "Uncategorized"),
    brand: typeof o?.brand === "string" && o.brand.trim() ? o.brand : null,
    tags: asStringArray(o?.tags),
    attributes: Array.isArray(o?.attributes)
      ? o.attributes
          .filter((a: any) => a && (a.label || a.value))
          .map((a: any) => ({ label: asString(a.label), value: asString(a.value) }))
      : [],
    seo: {
      metaTitle: asString(seo.metaTitle),
      metaDescription: asString(seo.metaDescription),
      keywords: asStringArray(seo.keywords),
      slug: asString(seo.slug),
      altText: asString(seo.altText),
    },
    imageSuggestions: Array.isArray(o?.imageSuggestions)
      ? o.imageSuggestions
          .filter((s: any) => s && (s.shot || s.purpose))
          .map((s: any) => ({ shot: asString(s.shot), purpose: asString(s.purpose) }))
      : [],
    confidence: typeof o?.confidence === "number" ? Math.max(0, Math.min(1, o.confidence)) : 0.6,
  };
}

/** Clearly-labeled sample used when no API key is configured or a live call fails. */
export const DEMO_ANALYSIS: ProductAnalysis = {
  name: "Trailblazer Low-Top Sneaker",
  title: "Trailblazer Low-Top Sneakers — Lightweight Everyday Trainers",
  shortDescription:
    "Lightweight low-top sneakers with a breathable knit upper and cushioned sole, built for all-day comfort.",
  description:
    "Step into all-day comfort with the Trailblazer Low-Top Sneaker. A breathable knit upper keeps feet cool, while the cushioned midsole absorbs impact from morning commutes to evening errands.\n\nThe durable rubber outsole adds grip on city streets, and the minimalist silhouette pairs easily with jeans, joggers, or shorts. A padded collar and tongue finish the fit for a secure, sock-like feel.\n\nAvailable in versatile neutral tones, these everyday trainers are a wardrobe staple for anyone who values comfort without sacrificing style.",
  category: "Footwear > Sneakers > Low-Top",
  brand: null,
  tags: [
    "sneakers",
    "low-top",
    "knit upper",
    "lightweight shoes",
    "everyday trainers",
    "casual footwear",
    "breathable shoes",
    "cushioned sole",
    "unisex sneakers",
    "athleisure",
  ],
  attributes: [
    { label: "Type", value: "Low-top sneaker" },
    { label: "Upper material", value: "Breathable knit" },
    { label: "Sole", value: "Cushioned EVA midsole, rubber outsole" },
    { label: "Closure", value: "Lace-up" },
    { label: "Color", value: "Neutral / grey" },
    { label: "Use case", value: "Everyday / casual" },
    { label: "Fit", value: "True to size, padded collar" },
  ],
  seo: {
    metaTitle: "Lightweight Low-Top Knit Sneakers | Everyday Trainers",
    metaDescription:
      "Breathable knit low-top sneakers with a cushioned sole for all-day comfort. Lightweight everyday trainers that pair with any casual outfit.",
    keywords: [
      "low-top sneakers",
      "knit sneakers",
      "lightweight trainers",
      "breathable shoes",
      "casual sneakers",
      "everyday shoes",
      "cushioned sneakers",
      "unisex trainers",
    ],
    slug: "trailblazer-low-top-knit-sneaker",
    altText: "Grey knit low-top lace-up sneaker on a white background, side profile view",
  },
  imageSuggestions: [
    { shot: "Side profile on white", purpose: "Primary hero image for search and listing thumbnail" },
    { shot: "Top-down / overhead", purpose: "Show lacing, tongue, and upper pattern" },
    { shot: "Sole / outsole close-up", purpose: "Highlight tread, grip, and build quality" },
    { shot: "On-foot lifestyle shot", purpose: "Convey fit, scale, and styling in context" },
    { shot: "Detail macro of knit texture", purpose: "Communicate material quality and breathability" },
    { shot: "Pair angled 3/4 view", purpose: "Hero alternative that shows depth and both shoes" },
  ],
  confidence: 0.78,
};
