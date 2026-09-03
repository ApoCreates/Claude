# Pulse — F&B Competitive Intelligence (demo)

<!-- Keep under one page. Claude reads all of it every session. -->

## Commands
- Dev: `npm run dev` (Next.js dev server on http://localhost:3000)
- Build: `npm run build` (must finish with no TypeScript errors)
- Start: `npm run start` (serves the production build)
- Lint: `npm run lint` (`next lint`; zero warnings)
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Test: none configured yet. When a test runner is added, wire it to `npm test` and update this line.

## Stack
- Next.js 14 (App Router) + React 18 + TypeScript + Tailwind. Recharts, Lucide icons.
- `@anthropic-ai/sdk` for live AI; canned responses when `ANTHROPIC_API_KEY` is unset.
- In-memory seeded dummy data. No database in the root app.
- Deployed on Vercel. Preview on every PR; production only from `main`.

## Conventions
- Functional components, hooks only. No class components.
- All data comes from `lib/data/`; AI prompts in `lib/ai/prompts.ts` read the same layer. Do not inline data in components.
- Claude API calls go through `lib/ai/client.ts` and the `app/api/` routes only. API keys never appear in client code.
- Tailwind only; no inline `style=` except for computed values.
- Keep the demo runnable offline: every live-AI surface needs a canned fallback.

## Architecture
- Root app: `app/` routes (`(app)/`, `api/`, `login/`), `components/` UI (`ai/`, `charts/`, `shell/`, `ui/`), `lib/` data + AI + utils.
- Standalone apps in the same repo, each its own Vercel project with its own `package.json`:
  `product-studio/` (Next.js), `aigency-film-festival/` (Next.js + Supabase), `roblox-vfx-forge/` and `wayout-quest/` (static). Run their commands from inside their folder.

## SDLC loop (see .claude/skills/sdlc-loop)
- No implementation without an accepted `plan.md`. Start in plan mode.
- Read `intent/` and `docs/sdlc/spec-*.md` for the change you are working on.
- If implementation departs from `plan.md`, update `plan.md` in the same commit.

## Verifying your work
Run build, lint and typecheck (and test, once it exists) before reporting any task complete,
and paste the output. If a test fails, fix the code, not the test.
For UI work, screenshot the result and compare to the mock.

## Things Claude gets wrong
- Do not bump dependency versions unasked.
- Do not edit `aigency-film-festival/supabase/*` by hand; write a new migration.
- Do not add a new npm package without saying why in the plan.
- Do not run root `npm` scripts against the standalone apps; `cd` into them first.
