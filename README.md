# FinCompare Africa

A pan-African financial **products** comparison directory — compare real rates,
fees and terms, read reviews, and see which providers are licence-verified.
**Phase 0** covers **Nigeria · personal loans** (built to expand to more
countries/products with no code changes).

See **PROJECT-SPEC.md** for the architecture and **CLAUDE.md** for the build
rules.

---

## Run it locally (step by step)

You need **Node 20+** installed. Check with:

```bash
node -v
```

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

You have two options. **Option A (Neon)** is recommended for your own setup.

#### Option A — Neon (free managed Postgres)

1. Go to **https://neon.tech** and sign up (free).
2. Click **New Project**. Give it a name (e.g. `fincompare`), pick a region near
   you, and create it.
3. On the project dashboard, find **Connection string** and copy it. It looks
   like:
   `postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`
4. In this project, copy the example env file and paste your string in:

   ```bash
   cp .env.example .env
   ```

   Open `.env` and set `DATABASE_URL` to the string you copied.

#### Option B — Local Postgres on a Mac (with Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb fincompare_dev
cp .env.example .env
```

Then set `DATABASE_URL` in `.env` to (replace `YOUR_MAC_USERNAME` with the output
of `whoami`):

```
postgresql://YOUR_MAC_USERNAME@localhost:5432/fincompare_dev?schema=public
```

### 3. Create the tables and load the sample data

```bash
npm run db:migrate
npm run seed
```

`npm run seed` loads ~24 sample Nigerian personal-loan products, ~14 providers, a
seeded CBN licence register, and the editorial content. **All of it is clearly
sample (SEED) data for demonstration.**

### 4. Start the app

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## What to look at (Milestone 1)

- **http://localhost:3000** — homepage: search, browse by country/product,
  featured & verified products, popular comparisons.
- **http://localhost:3000/ng/personal-loans** — the comparison hub
  ("Best personal loans in Nigeria (2026)"): editorial intro, a sortable /
  filterable comparison table, an FAQ block, and related links.
- **http://localhost:3000/product/gtbank-quick-credit** — a product page: terms
  table, "what you'd actually pay" illustration, eligibility, required documents,
  reviews, an Alternatives block, the verified badge, an Apply CTA, and the
  disclaimer + last-verified date.
- **http://localhost:3000/methodology** — how we compare + named editorial
  responsibility (needed for Google to trust a finance site).

### Check the structured data (SEO)

While the dev server runs, view a page's source (right-click → View Page Source)
and search for `application/ld+json`. You should see:

- on a **product** page: `LoanOrCredit` (with `annualPercentageRate`, `amount`,
  `aggregateRating`, `review`) + `BreadcrumbList`.
- on the **hub** page: `FAQPage` + `ItemList` + `BreadcrumbList`.

Quick command-line check:

```bash
curl -s http://localhost:3000/product/gtbank-quick-credit | grep -o '"@type":"[^"]*"' | sort -u
curl -s http://localhost:3000/ng/personal-loans | grep -o '"@type":"[^"]*"' | sort -u
```

Once deployed to a public URL, validate it in
**https://validator.schema.org/** or Google's Rich Results Test.

### See the guardrails in action

- Every comparison row and product shows **"Indicative only…"** + a
  **last-verified date**.
- **`access-payday-loan`** (licensed + claimed) shows the gold **Verified**
  badge; **`quicknaira-express-loan`** (deliberately unlicensed sample) never
  does and shows a "not matched to the register" note.
- Sponsored sample rows are labelled **Sponsored**.

## What to look at (Milestone 2 — discovery tools)

- **http://localhost:3000/search** — faceted search. Try a keyword (e.g.
  `salary`), then narrow by provider type, amount, tenure, max interest,
  use-case or "no fees", and re-sort. Text search uses Postgres full-text search.
- **http://localhost:3000/calculators/loan-repayment** — enter an amount, rate
  and tenure to see the monthly repayment and total cost instantly, then press
  **Find matching products** to see personal loans that fit, cheapest first.
- **Compare:** on the hub or search results, click **+ Compare** on 2–4 products
  — a bar appears at the bottom; click **Compare now** to see them side by side
  at **http://localhost:3000/compare**.

## What to look at (Milestone 3 — accounts & reviews)

Sign-in is only needed to **contribute** (write a review, later claim a listing).
Browsing stays completely open.

**Sign in (works locally with no setup):**
1. Click **Sign in** (top right) → choose "I'm a user" or "I represent a
   business" → type any email → **Continue with email**. (Locally this is a
   passwordless dev login; in production it becomes a secure email magic-link.)
2. To get **admin / moderation** access, sign in with the email listed in
   `ADMIN_EMAILS` in your `.env` (currently your own email).

**Write a review:** open any product → **Write a review** → rate it, add a
title/body, tick the confirmation → submit. It is saved as **pending** and does
**not** appear publicly yet.

**Moderate:** as an admin, click **Moderation** in the header (or visit
`/admin/reviews`) → **Approve & publish**. The review then appears on the product
page and the product's star rating updates.

> Tip: run `npm run seed` any time to reset the sample data to its original state.

### Enabling Google sign-in (optional)

1. Go to **https://console.cloud.google.com** → create a project.
2. **APIs & Services → OAuth consent screen** → set it up (External, add your
   email as a test user).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   type **Web application**.
4. Add an **Authorized redirect URI**:
   `http://localhost:3000/api/auth/callback/google`
   (and your production URL's equivalent when you deploy).
5. Copy the **Client ID** and **Client secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="..."
   ```
6. Restart `npm run dev`. A **Continue with Google** button now appears on
   `/signin`.

## What to look at (Milestone 4 — provider side)

**Claim a listing → instant gold badge:**
1. Sign in (any email), then open **Claim this listing** on a product page (or go
   to `/claim`).
2. Search a provider that is licensed but unclaimed, e.g. **Guaranty Trust Bank**
   → **This is mine**.
3. Verify with a work email on the provider's domain — e.g. `manager@gtbank.com`
   (the page tells you the exact domain) → **Verify by email**. You're approved
   instantly and the provider's products now show the gold **Verified** badge.
   (Emails on other domains, or document uploads, go to an admin queue at
   `/admin/claims` instead.)

**Provider dashboard (`/dashboard`):**
- See your products, **edit terms** (rate, fee, amounts, tenure, eligibility) —
  saving stamps a fresh "last verified" date.
- **Confirm current** refreshes the last-verified date without changing figures.
- **Respond** to reviews — your response appears publicly under the review.

> Only providers on the CBN licence register can ever show the gold badge, even
> after claiming — try claiming `QuickNaira` to see it stays unverified.

---

## Other commands

```bash
npm run db:studio          # browse the database in a UI
npm run build && npm start # production build + serve
npm run scrape:example     # run the example ingestion scraper (offline demo)
```

## Ingestion

Ingestion scripts live in `ingestion/` and are separate from the web app:

- `ingestion/seed/*.json` — hand-curated SEED data.
- `ingestion/scrapers/example-provider.ts` — a single-provider example scraper
  (Cheerio) that respects `robots.txt`, to prove the pipeline. Run with
  `npm run scrape:example -- <url>` or with no URL for an offline demo.
