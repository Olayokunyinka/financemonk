# PROJECT-SPEC — FinCompare Africa

> Pan-African financial **products** comparison directory (MoneySuperMarket /
> NerdWallet pattern for Africa). The listed unit is a product (a specific loan,
> savings account, insurance policy), not a company. Organic SEO is the growth
> engine; revenue is apply/referral leads, sponsored placement and ads.
>
> Source of truth: `PRD-2-African-Financial-Products-Directory.md`,
> `Wireframes-0-CORE-Engine.md`, `Wireframes-2-Financial-Products.md`.

## Phase 0 scope (current build)

**Nigeria · personal loans only.** The data model and routing are built
multi-country / multi-product-family from day one, so adding Kenya, South Africa,
savings accounts, insurance, etc. is a **content drop** (seed data + editorial),
not a code change. See "Adding a country / family" below.

Out of scope for Phase 0 (later phases): multiple countries/families live,
dedicated search engine (Elastic/Meili), real multi-provider scraping pipeline,
AdSense, advanced analytics, mobile apps, email campaigns.

## Tech stack

- **Next.js 16 (App Router) + TypeScript**, React 19. Directory/SEO pages use
  `generateStaticParams` + ISR (`export const revalidate`).
- **Tailwind CSS v4** (CSS `@theme` tokens in `src/app/globals.css`) +
  shadcn/ui-style primitives in `src/components/ui`.
- **PostgreSQL** via **Neon** (managed). Local dev can use a local Postgres.
- **Prisma 7** ORM with the **pg driver adapter** (`@prisma/adapter-pg`).
  Generated client lives in `src/generated/prisma` (git-ignored). DB URL is read
  from `.env` via `prisma.config.ts` (`import "dotenv/config"`).
- **Postgres full-text search** for search/filter (Milestone 2). No external
  search engine.
- **Auth.js (NextAuth)** for accounts — Google + email (Milestone 3).
- **Vercel** for hosting.
- **Ingestion** = standalone Node/TS scripts under `ingestion/`, separate from
  the web app (Cheerio + JSON seed files), run via `tsx`.

> ⚠️ This is Next.js 16 — newer than common training data. Read
> `node_modules/next/dist/docs/` before using an unfamiliar API. Notably:
> `params`/`searchParams` are **Promises** (await them); `PageProps<'/route'>`
> is a global helper.

## Data model (Prisma — `prisma/schema.prisma`)

- **Provider** — institution. `licensed`, `licenseRef`, `licenseSource`,
  `licenseVerifiedAt` (cached from the register match), `claimed`.
- **Product** — the listed unit. Comparable terms: `aprMin/aprMax`,
  `interestRate`, `fees` (Json itemised), `minAmount/maxAmount`, `currency`,
  `minTenureMonths/maxTenureMonths`, `eligibility[]`, `requiredDocs[]`,
  `features[]`. Trust/freshness: `verificationBadge`, `disclaimerState`,
  `sourceRefs`, `lastVerifiedAt`. Listing: `live` (counts toward thin-content
  threshold), `sponsored` (labelled in UI). Denormalised `ratingAggregate`,
  `reviewCount`.
- **LicensedInstitution** — the verification source of truth (seeded CBN
  register). Gold badge requires a Provider matched here.
- **Hub** — editorial intro + FAQ + related links per country × family. Drives
  the unique-intro requirement of the thin-content rule.
- **User / Account / Session / VerificationToken** — Auth.js (wired in M3) +
  `role` (USER/BUSINESS/ADMIN).
- **Review** — overall + sub-ratings (transparency, customerService, ease,
  value), `reviewerType` (CUSTOMER/VERIFIED_CUSTOMER), `status`
  (PENDING/PUBLISHED/REJECTED — moderation), `ownerResponse`.
- **Claim** — provider claim (method, status, evidence).
- **Lead** — application captured at Apply; `cpaEventAt`. Recorded even when CPA
  is off.
- **Commission** — one per Lead, created when a provider marks a lead CONVERTED
  and the product has a `cpaPayout` (deal rate set per product by an admin).
  Amount + currency snapshot, status PENDING/PAID. Powers `/admin/revenue`.

## Finance & SEO guardrails (HARD — never weaken)

1. **Disclaimer + last-verified on every product and every comparison row.**
   Implemented once in `src/components/disclaimer.tsx`
   (`<Disclaimer>` / `<LastVerified>`). Stale figures (> 90 days) are flagged.
2. **Gold "Verified" badge only for licensed AND claimed providers.** Single
   source of truth: `src/lib/verification.ts` (`resolveBadge`). Mirrored in the
   seed badge computation. Never label an unlicensed/unknown provider Verified.
3. **Methodology + named editorial responsibility** live from the first public
   milestone: `/methodology` (+ `#editorial`) and `SITE.editorial` in
   `src/lib/site.ts`. (Currently a SEED placeholder name — replace before
   launch.)
4. **Sponsored rows clearly labelled** — `Badge variant="sponsored"`.
5. **`CPA_ENABLED` (env, default OFF)** gates the Apply→referral flow.
   `src/lib/site.ts` carries the warning that paid referral/intermediation may
   require a per-country financial-services licence and must be cleared legally
   first. (Not legal advice.)
6. **Thin-content rule:** a hub renders but is `noindex` unless it has
   ≥ `HUB_MIN_PRODUCTS` (env, default 5) live products **and** a unique intro
   (≥ 200 chars). Logic: `hubIsIndexable` in `src/lib/queries.ts`; applied in the
   hub page's `generateMetadata` and the sitemap.
7. **Browsing is fully open to crawlers.** No auth/JS gates on directory content.

## SEO architecture

- Clean URLs: `/{country}/{family}` (e.g. `/ng/personal-loans`),
  `/product/{slug}`.
- Schema.org JSON-LD via `src/lib/jsonld.ts` + `<JsonLd>`:
  FinancialProduct/LoanOrCredit, Review, AggregateRating, FAQPage, ItemList,
  BreadcrumbList, Organization.
- Internal-linking mesh: footer country × family grid; hub → related links;
  product → hub + Alternatives.
- `sitemap.xml` (thin-content aware) + `robots.txt` via the metadata file
  conventions (`src/app/sitemap.ts`, `src/app/robots.ts`).

## Adding a country / family (later phases — no code change)

1. Add the entry to `COUNTRIES` / `FAMILIES` in `src/lib/taxonomy.ts`.
2. Add seed JSON: providers, products, licensed register, a hub (unique intro +
   FAQ), optional reviews under `ingestion/seed/`.
3. `npm run seed`. The new hub/products are statically generated automatically.

## Milestones

1. **Foundation + public SEO slice** ✅ — scaffold, DB, seed, homepage, hub,
   product detail, methodology, schema.org, guardrails, docs.
2. **Discovery tools** ✅ — faceted `/search` (Postgres FTS), compare tray +
   `/compare`, loan repayment calculator. (Sitemap/robots already in place.)
3. **Accounts & reviews** ✅ — Auth.js (Google env-gated + dev email login),
   user/business role toggle, auth-gated write-a-review with sub-ratings +
   verified-customer flag, admin moderation queue, aggregate recompute on
   publish.
4. **Provider side** ✅ — claim flow (`/claim` search → domain-email auto-verify
   or document → staff queue), verification vs register (gold only if
   licensed+claimed), admin `/admin/claims`, provider `/dashboard` (edit terms,
   confirm-current, respond to reviews).
**Phase 1 progress:** real named editorial identity (env-overridable); Google +
Resend email sign-in (so `AUTH_DEV_LOGIN` can be off in prod); added slices
(Kenya personal loans, Nigeria & South Africa savings) as pure seed/taxonomy
drops; CPA payout/commission tracking with an admin `/admin/revenue` view.
Signing actual referral deals is a commercial/BD step outside the codebase.

**M6 — ingestion pipeline** (`ingestion/`): adapters (`adapters/*.ts`, HTML via
Cheerio + PDF via `pdf-parse`) implement one `Adapter` interface; `run.ts`
(`npm run ingest`) normalises (`normalize.ts`), diffs each draft against the live
`Product`, and stages `ProductDraft` rows under an `IngestionRun`. Offline
against `ingestion/fixtures/` by default; `--live` fetches real URLs respecting
`robots.txt`. Admins review diffs and publish at `/admin/ingestion`
(`src/lib/ingestion.ts` `publishDraft` — upsert with **preserve-on-missing**,
fresh `lastVerifiedAt` + source, `recomputeProviderBadges`). Nothing is public
until approved. Next: M8 editorial CMS, M9 SEO.

**M7 — rate-freshness service:** `src/lib/freshness.ts` turns a product's
`lastVerifiedAt` into fresh/ageing/stale (thresholds 45/90 days, env-overridable
via `NEXT_PUBLIC_*`); `<LastVerified>` flags stale figures everywhere. Admin
freshness dashboard `/admin/freshness` (counts + oldest-first "needs
re-checking" + "mark re-checked"); provider dashboard nudges stale products to
"confirm current". Scheduled refresh: `runIngestion()` is shared by the CLI and
a `GET /api/cron/refresh` route (nodejs runtime, `CRON_SECRET`-gated, stages
drafts — never auto-publishes); `vercel.json` runs it daily. `pdf-parse`/
`pdfjs-dist` are `serverExternalPackages` so the worker resolves in the route.

5. **Monetisation gate + ship** ✅ — Apply flow (`/apply/[slug]`) captures a Lead
   always; CPA event + hand-off only when `CPA_ENABLED` (default OFF, legal
   warning in code). Leads surface in the dashboard with status. Sponsored rows
   labelled throughout. Vercel deploy steps in README. *(current — Phase 0
   feature-complete)*

## Conventions

- DB reads for pages live in `src/lib/queries.ts`; faceted search in
  `src/lib/search.ts`. Pages stay thin.
- **Full-text search**: `Product.searchVector` is a STORED GENERATED `tsvector`
  (over name + summary) with a GIN index, added in migration `*_product_fts`.
  Only IMMUTABLE functions are allowed in a generated column, so `features` (which
  needs the STABLE `array_to_string`) is excluded from FTS and searched via the
  use-case facet instead. Queried with `websearch_to_tsquery` via `$queryRaw`.
- **Compare tray** is client-side (`localStorage`, `src/components/compare/`),
  surfaced as a global `<CompareBar>` in the layout; `/compare?ids=` renders the
  side-by-side view.
- **Auth** (`src/auth.ts`, Auth.js v5): JWT sessions; Prisma adapter persists
  users/links OAuth. Providers: Google (env-gated) + a dev passwordless email
  login (`AUTH_DEV_LOGIN`, local only). Role lives on the JWT; admins via
  `ADMIN_EMAILS`. **Critical SSG rule:** never call `auth()` in the root layout
  or header — it would force every SEO page dynamic. Auth state renders in a
  client island (`<AuthNav>` via `SessionProvider` in `<Providers>`); only the
  contribution routes (`/product/[slug]/review`, `/admin/reviews`, `/signin`)
  are dynamic.
- **Reviews**: auth-gated submission creates `PENDING`; admin `/admin/reviews`
  approves → `PUBLISHED`; `recomputeProductRating` (`src/lib/ratings.ts`)
  refreshes the product aggregate from PUBLISHED reviews and `revalidatePath`
  refreshes the (ISR) product page.
- **Claims** (`src/lib/providers.ts`): domain-email match (email domain ==
  provider website domain) auto-approves; otherwise document → `/admin/claims`.
  `applyApprovedClaim` sets `claimed`/`claimedBy`, promotes the user to
  BUSINESS, and `recomputeProviderBadges` flips products to gold for licensed
  providers. The gold rule still lives in `resolveBadge` + this recompute.
- **Dashboard** (`/dashboard`, `dashboard/actions.ts`): owner-or-admin checks
  via `assertOwnsProduct`; edits stamp `lastVerifiedAt` + `PROVIDER_CONFIRMED`;
  `confirmCurrent` refreshes freshness; `respondToReview` writes `ownerResponse`
  (shown on the product page). All revalidate the affected product + hub.
- Plain serializable data crosses into client components via `src/lib/rows.ts`.
- Money/percent/date formatting in `src/lib/format.ts`; loan maths in
  `src/lib/loan.ts`.
- All seed data is clearly SEED/demonstration data.
- Commit after each working milestone.
