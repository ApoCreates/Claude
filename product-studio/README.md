# Product Studio — image → listing

Upload a product photo and get a complete, publish-ready listing back. Claude's vision model identifies the product and returns:

- **Product name** and an SEO-friendly **listing title**
- **Short** and **full descriptions**
- **Tags** for search/filtering
- **Attributes & metadata** (color, material, style, features…)
- **SEO block** — meta title, meta description, keywords, URL slug, image alt text, plus a live search-result preview
- **Recommended product images** — a suggested gallery/shot list to pair with the uploaded photo

Copy any field to the clipboard or export the whole result as JSON. Pick a target marketplace (Amazon, Shopify, Etsy, eBay, Google Shopping…) and add an optional hint to steer the output. Upload by drag-and-drop, click-to-browse, or clipboard paste (JPEG/PNG/WebP/GIF, up to 8 MB).

This is a **standalone Next.js app**, independent of anything else in the repository. The home page (`/`) is the dashboard itself.

## Stack

- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- Lucide icons
- `@anthropic-ai/sdk` for Claude vision

## Run it

```bash
cd product-studio
npm install
cp .env.example .env.local   # optional — add ANTHROPIC_API_KEY for live analysis
npm run dev
```

Open http://localhost:3000.

With `ANTHROPIC_API_KEY` set, the uploaded image is analyzed live (default model `claude-sonnet-4-6` supports vision). Without it, the app returns a clearly-labeled demo result so the flow works fully offline.

## Deploying on Vercel

This app lives in the `product-studio/` subdirectory of the repo. To deploy it as its own Vercel project:

1. Create a **new** Vercel project from this GitHub repo.
2. Set **Root Directory** to `product-studio`.
3. Add the `ANTHROPIC_API_KEY` environment variable (and optionally `ANTHROPIC_MODEL`).

That keeps it on a separate URL/deployment from any other app in the repo.

## Layout

- `app/` — root layout (header + Live/Demo badge), the dashboard page, and the `api/product/analyze` route
- `components/product/` — uploader, results panel, copy controls
- `lib/ai/client.ts` — Anthropic client + model selection
- `lib/ai/product.ts` — types, vision prompt, response parser, demo data
