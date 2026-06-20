# Per-country launch checklist

Each new country is a **product launch, not a config change** — it resets the
legal gate and needs its own licence-register source and provider relationships
(see PRD §11 and the roadmap Phase 4). The engine is country-agnostic; this is
the repeatable checklist.

## 1. Legal (gate — do this first)
- [ ] Get **jurisdiction-specific legal advice** on financial-promotion /
      intermediation rules. Confirm whether comparing/listing is allowed and what
      (if anything) requires a licence.
- [ ] Confirm **CPA is OFF** for the country until a lawyer clears paid referral
      (`CPA_ENABLED` stays false). Sponsored placement / subscriptions usually
      launch earlier — confirm per country.

## 2. Data
- [ ] Identify the **licensed-institution register** (the verification source of
      truth) and add it as `ingestion/seed/licensed-institutions.<cc>.json`.
- [ ] Add providers `ingestion/seed/providers.<cc>.json` (mark which are
      claimed; licence match is automatic by name).
- [ ] Add product slices `ingestion/seed/products.<cc>.<family>.json` (≥
      `HUB_MIN_PRODUCTS` live per hub or it stays `noindex`).
- [ ] Add a **unique editorial intro + FAQ** per hub in
      `ingestion/seed/hubs.json` (thin-content rule needs ≥200-char intro).
- [ ] Build/point ingestion **adapters** at the real sources (HTML/PDF) and wire
      the scheduled refresh.

## 3. Code (usually just config)
- [ ] Add the country to `COUNTRIES` in `src/lib/taxonomy.ts`
      (`code`, `name`, `currency`, `currencySymbol`, `locale`, `regulator`).
- [ ] Currency symbol + locale formatting, hreflang alternates, the country
      landing page (`/<cc>`), sitemap and the link mesh all pick it up
      automatically from the taxonomy + DB hubs. **No routing changes.**
- [ ] (If a new product family) add it to `FAMILIES` with the right `kind`.

## 4. SEO / trust
- [ ] Methodology + named editorial responsibility apply globally (already live).
- [ ] Confirm hreflang alternates link the same family across countries.
- [ ] Submit the updated sitemap in Search Console.

## 5. Monetise (after traffic)
- [ ] Sponsored placement / premium subscriptions (no licence needed in most
      countries — confirm).
- [ ] CPA only after the legal clearance in step 1; then set per-product
      `cpaPayout` and sign referral deals.

> Rule of thumb: never widen faster than you can keep the rate data accurate and
> the legal position clean.
