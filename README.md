# Pulse — F&B Competitive Intelligence (Demo)

An AI-powered command center for food & beverage executives. Built as a clickable demo with dummy data so the full UI flow and AI surfaces can be walked through with stakeholders before any real ingestion or deployment work is committed.

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
