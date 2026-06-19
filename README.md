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
