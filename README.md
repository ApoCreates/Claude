# Pulse — F&B Competitive Intelligence (Demo)

An AI-powered command center for food & beverage executives. Built as a clickable demo with dummy data so the full UI flow and AI surfaces can be walked through with stakeholders before any real ingestion or deployment work is committed.

> **Also in this repo:** [Product Studio](#product-studio--image--listing) at `/studio` — upload a product image and get a publish-ready listing (name, title, descriptions, tags, metadata, SEO, recommended images) powered by Claude vision.

---

## Product Studio — image → listing

A standalone dashboard at **`/studio`** (no login required). Upload a product photo and Claude's vision model returns a complete, publish-ready listing:

- **Product name** and SEO-friendly **listing title**
- **Short** and **full descriptions**
- **Tags** for search/filtering
- **Attributes & metadata** (color, material, style, features…)
- **SEO block** — meta title, meta description, keywords, URL slug, image alt text, plus a live search-result preview
- **Recommended product images** — a suggested gallery/shot list to complete the listing

Copy any field to the clipboard or export the whole result as JSON.

Pick a target marketplace (Amazon, Shopify, Etsy, eBay, Google Shopping…) and add an optional hint to steer the output. Drag-and-drop, click-to-browse, and clipboard paste are all supported (JPEG/PNG/WebP/GIF, up to 8 MB).

With `ANTHROPIC_API_KEY` set, the uploaded image is analyzed live; without it, the dashboard returns a clearly-labeled demo result so the flow can be walked through fully offline. The seam:

- `app/studio/` — page + standalone shell
- `components/product/` — uploader, results panel, copy controls
- `app/api/product/analyze/route.ts` — vision call + JSON parsing, with demo fallback
- `lib/ai/product.ts` — types, prompt, response parser, demo data

---

## What's in the demo

22 screens across 7 modules:

- **Overview** — Executive dashboard, morning brief (today + archive)
- **Commercial** — Sales overview, per-region detail, products list + SKU detail, outlets list + outlet detail
- **Intelligence** — Competitor landscape + competitor brief (AI), AI data analyst (chat), predictive scenarios (list + builder), C-level advisory
- **Platform** — Integrations status, settings, users

## AI behavior

Hybrid:
- **Live Claude API** for the AI analyst chat, competitor briefs, and the scenario builder. Requires `ANTHROPIC_API_KEY`.
- **Canned responses** for the morning brief and as a fallback for the live endpoints when no API key is set. The demo runs fully offline if needed.

A `Live AI` / `Canned AI` badge in the topbar makes the current mode visible.

## Stack

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- Recharts for charts
- Lucide icons
- `@anthropic-ai/sdk` for AI features
- In-memory dummy data — no database

## Run it

```bash
npm install
cp .env.example .env.local   # optional — add ANTHROPIC_API_KEY for live AI
npm run dev
```

Open http://localhost:3000 and sign in with any demo account (e.g. `ceo@demo.fnb`).

## Dummy data

All data is synthetic but internally consistent (seeded generators) so charts, tables, and AI context tell the same story. See `lib/data/`:

- `products.ts` — 16 SKUs across 6 brands and 6 categories
- `outlets.ts` — 48 outlets across 5 regions and 5 channels
- `sales.ts` — 90 days of daily revenue/unit series with weekly seasonality
- `competition.ts` — 5 tracked competitors with category share data
- `scenarios.ts` — 3 modeled scenarios
- `briefs.ts` — 3 canned morning briefs
- `integrations.ts` — 6 placeholder data-source connections
- `users.ts` — 5 demo accounts

## Wiring this to real data

Each module in `lib/data/` is the seam. Replace the exported constants with connectors (REST, warehouse, dbt models, scan-data extracts) and the UI keeps working unchanged. The AI prompts in `lib/ai/prompts.ts` read from the same data layer, so they stay in sync automatically.
