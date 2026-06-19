@AGENTS.md

# FinCompare Africa — working notes for Claude

Read **PROJECT-SPEC.md** first — it holds the architecture, data model, stack,
milestones and the full guardrails. This file is the quick-reference.

## What this is

Pan-African financial **products** comparison directory. Phase 0 builds **one
slice end-to-end: Nigeria · personal loans**, but the schema/routing are
multi-country/family so new slices are seed-data drops, not code.

## Stack gotchas (don't relearn the hard way)

- **Next.js 16** (not 14/15). `params`/`searchParams` are **Promises** — await
  them. `PageProps<'/route'>`/`LayoutProps` are global. Read
  `node_modules/next/dist/docs/` before using unfamiliar APIs. ISR via
  `export const revalidate = <seconds>`.
- **Tailwind v4** — theme tokens are CSS `@theme` in `src/app/globals.css`
  (no `tailwind.config.js`).
- **Prisma 7** — generated client in `src/generated/prisma` (import
  `@/generated/prisma/client` and `/enums`). Requires the **pg driver adapter**
  (`new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`). DB URL
  comes from `.env` via `prisma.config.ts`. Use the singleton in
  `src/lib/prisma.ts`.
- shadcn-style UI primitives are hand-built in `src/components/ui` (no CLI).

## HARD guardrails (never weaken — see PROJECT-SPEC for detail)

1. Disclaimer + last-verified on **every** product and comparison row
   (`src/components/disclaimer.tsx`).
2. Gold "Verified" badge **only** for licensed **and** claimed providers
   (`src/lib/verification.ts` `resolveBadge` — the only place this is decided).
3. `/methodology` + named editorial responsibility (`src/lib/site.ts`) stay live.
4. Sponsored rows always labelled.
5. `CPA_ENABLED` env default OFF gates Apply→referral (+ legal warning comment).
6. Thin-content: hub is `noindex` unless ≥ `HUB_MIN_PRODUCTS` live products AND a
   unique intro (`hubIsIndexable` in `src/lib/queries.ts`).
7. Browsing fully open to crawlers — never gate directory content behind auth/JS.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run db:migrate` — create/apply a migration
- `npm run seed` — load SEED data (Nigeria personal loans)
- `npm run build` / `npm run start` — production build / serve
- `npm run scrape:example -- <url>` — example single-provider scraper (offline
  demo if no URL)

## Workflow

Build one milestone at a time; run + show how to test; commit after each.
