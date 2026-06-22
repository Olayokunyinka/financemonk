// REAL aggregator adapter — Central Bank of Nigeria "Money Market Indicators".
//
//   Source:  https://www.cbn.gov.ng/api/GetAllMoneyMarketIndicators (JSON API
//            that backs https://www.cbn.gov.ng/rates/mnymktind.html — the page
//            renders these rows client-side, so we read the API directly)
//   Family:  SAVINGS (deposit benchmarks)
//   Emits:   indicative SAVINGS benchmark drafts for the latest published month
//            (savings deposit rate + the 1/3/6/12-month term-deposit rates),
//            attributed to a "cbn-benchmark" reference provider. Editors compare
//            real provider products against these in /admin/ingestion; nothing
//            auto-publishes.
//
// Why this source is ToS-approved for --live:
//   - Public-sector statistical data published by the regulator (CBN), intended
//     for public consumption and republication with attribution.
//   - robots.txt (checked 2026-06-21) allows "/" and only disallows
//     /footer.html, /header.html, /museum/, /*.asp$, /appsettings.json — the
//     /api/ JSON endpoint is permitted.
//   - politeFetch additionally enforces robots + a 1.5s/host rate limit at call
//     time, and we fetch a single endpoint per run.
//
// Figures are flagged INDICATIVE (they move monthly and must be re-verified
// before any editorial use) with source attribution + the CBN period.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Adapter, RawProductDraft } from "./types";
import { politeFetch } from "../lib/parse";
import { liveAllowed } from "../lib/source";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "cbn-money-market.json");
const LIVE_URL = "https://www.cbn.gov.ng/api/GetAllMoneyMarketIndicators";
const SOURCE_LABEL = "CBN Money Market Indicators";
const PROVIDER_SLUG = "cbn-benchmark";

// One row of the CBN API (rate fields are strings like "7.17", or "" if absent).
type CbnRow = {
  tyear?: number;
  tmonth?: number;
  period?: string;
  savingsDeposit?: string;
  oneMonthDeposit?: string;
  threeMonthsDeposit?: string;
  sixMonthsDeposit?: string;
  twelveMonthsDeposit?: string;
};

// Deposit indicators -> SAVINGS benchmark drafts. `field` is the CBN JSON key,
// `tenor` the term in months (null for the at-call savings rate).
const DEPOSIT_INDICATORS: {
  slug: string;
  name: string;
  field: keyof CbnRow;
  tenor: number | null;
}[] = [
  { slug: "cbn-savings-deposit-benchmark", name: "CBN Benchmark — Savings Deposit Rate", field: "savingsDeposit", tenor: null },
  { slug: "cbn-1m-term-deposit-benchmark", name: "CBN Benchmark — 1-Month Term Deposit", field: "oneMonthDeposit", tenor: 1 },
  { slug: "cbn-3m-term-deposit-benchmark", name: "CBN Benchmark — 3-Month Term Deposit", field: "threeMonthsDeposit", tenor: 3 },
  { slug: "cbn-6m-term-deposit-benchmark", name: "CBN Benchmark — 6-Month Term Deposit", field: "sixMonthsDeposit", tenor: 6 },
  { slug: "cbn-12m-term-deposit-benchmark", name: "CBN Benchmark — 12-Month Term Deposit", field: "twelveMonthsDeposit", tenor: 12 },
];

function parsePercent(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/%/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Pick the most recent published month (API order isn't guaranteed).
function latestRow(rows: CbnRow[]): CbnRow | null {
  const ranked = rows
    .filter((r) => r.tyear != null && r.tmonth != null)
    .sort((a, b) => b.tyear! * 12 + b.tmonth! - (a.tyear! * 12 + a.tmonth!));
  return ranked[0] ?? rows[0] ?? null;
}

function parseJson(raw: string, sourceUrl: string, fetchedAt: string): RawProductDraft[] {
  let rows: CbnRow[];
  try {
    const data = JSON.parse(raw);
    rows = Array.isArray(data) ? data : [];
  } catch {
    return [];
  }

  const row = latestRow(rows);
  if (!row) return [];
  const period = row.period?.trim() || `${row.tyear}-${row.tmonth}`;

  const drafts: RawProductDraft[] = [];
  for (const ind of DEPOSIT_INDICATORS) {
    const rate = parsePercent(row[ind.field] as string | undefined);
    if (rate == null) continue; // indicator missing this month — skip, don't fabricate
    drafts.push({
      providerSlug: PROVIDER_SLUG,
      slug: ind.slug,
      name: ind.name,
      summary:
        `INDICATIVE benchmark deposit rate published by the Central Bank of ` +
        `Nigeria (${period}) — a market reference for editors, not a provider ` +
        `product offer.`,
      interestRate: rate,
      minTenureMonths: ind.tenor,
      maxTenureMonths: ind.tenor,
      fees: [{ label: "Benchmark reference — no product fees", amount: 0 }],
      features: [`Source: ${SOURCE_LABEL}`, `CBN period: ${period}`],
      sourceUrl,
      indicative: true,
      sourceLabel: `${SOURCE_LABEL} (${period})`,
      lastVerifiedAt: fetchedAt,
    });
  }
  return drafts;
}

export const cbnMoneyMarketAdapter: Adapter = {
  id: "cbn-money-market",
  providerSlug: PROVIDER_SLUG,
  country: "ng",
  productType: "SAVINGS",
  label: "CBN Money Market Indicators (deposit benchmarks)",
  tos: {
    status: "approved",
    checkedAt: "2026-06-21",
    notes:
      "Public-sector CBN statistical data; robots.txt permits /api/; " +
      "republished with attribution as INDICATIVE benchmarks.",
  },
  async run({ live }) {
    const today = new Date().toISOString().slice(0, 10);
    if (liveAllowed(cbnMoneyMarketAdapter, live)) {
      const res = await politeFetch(LIVE_URL);
      if (!res) return [];
      return parseJson(await res.text(), LIVE_URL, today);
    }
    return parseJson(
      readFileSync(FIXTURE, "utf8"),
      `${FIXTURE} (offline fixture)`,
      today,
    );
  },
};
