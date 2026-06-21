// REAL aggregator adapter — Central Bank of Nigeria "Money Market Indicators".
//
//   Source:  https://www.cbn.gov.ng/rates/mnymktind.html
//   Family:  SAVINGS (deposit benchmarks)
//   Emits:   indicative SAVINGS benchmark drafts (savings deposit rate + the
//            1/3/6/12-month term-deposit rates) attributed to a "cbn-benchmark"
//            reference provider. Editors compare real provider products against
//            these CBN benchmarks in /admin/ingestion; nothing auto-publishes.
//
// Why this source is ToS-approved for --live:
//   - Public-sector statistical data published by the regulator (CBN), intended
//     for public consumption and republication with attribution.
//   - robots.txt (checked 2026-06-21) allows "/" and only disallows
//     /footer.html, /header.html, /museum/, /*.asp$, /appsettings.json — the
//     /rates/*.html page is permitted.
//   - politeFetch additionally enforces robots + a 1.5s/host rate limit at call
//     time, and we fetch a single page per run.
//
// Figures are flagged INDICATIVE (they move and must be re-verified before any
// editorial use) with source attribution + fetch date carried to the QA queue.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Adapter, RawProductDraft } from "./types";
import { politeFetch } from "../lib/parse";
import { liveAllowed } from "../lib/source";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "cbn-money-market.html");
const LIVE_URL = "https://www.cbn.gov.ng/rates/mnymktind.html";
const SOURCE_LABEL = "CBN Money Market Indicators";
const PROVIDER_SLUG = "cbn-benchmark";

// Deposit indicators we lift into SAVINGS benchmark drafts. Each label is a
// case-insensitive regex matched against the first cell of every table row, so
// the parser survives column/markup churn on the CBN page.
const DEPOSIT_INDICATORS: { slug: string; name: string; match: RegExp }[] = [
  {
    slug: "cbn-savings-deposit-benchmark",
    name: "CBN Benchmark — Savings Deposit Rate",
    match: /^savings\s+deposit\s+rate/i,
  },
  {
    slug: "cbn-1m-term-deposit-benchmark",
    name: "CBN Benchmark — 1-Month Term Deposit",
    match: /^1\s*month.*deposit/i,
  },
  {
    slug: "cbn-3m-term-deposit-benchmark",
    name: "CBN Benchmark — 3-Month Term Deposit",
    match: /^3\s*months?.*deposit/i,
  },
  {
    slug: "cbn-6m-term-deposit-benchmark",
    name: "CBN Benchmark — 6-Month Term Deposit",
    match: /^6\s*months?.*deposit/i,
  },
  {
    slug: "cbn-12m-term-deposit-benchmark",
    name: "CBN Benchmark — 12-Month Term Deposit",
    match: /^12\s*months?.*deposit/i,
  },
];

const TENURE_MONTHS: Record<string, number> = {
  "cbn-1m-term-deposit-benchmark": 1,
  "cbn-3m-term-deposit-benchmark": 3,
  "cbn-6m-term-deposit-benchmark": 6,
  "cbn-12m-term-deposit-benchmark": 12,
};

// First numeric token in a cell, read as a percentage (e.g. "6.80" -> 6.8).
function parsePercentCell(s: string): number | null {
  const m = s.replace(/%/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function parseHtml(html: string, sourceUrl: string, fetchedAt: string): RawProductDraft[] {
  const $ = cheerio.load(html);

  // Flatten every table row to [label, ...cellTexts] regardless of which table
  // it lives in — the CBN grid is the only label/rate table on the page.
  const rows: string[][] = [];
  $("tr").each((_, tr) => {
    const cells = $(tr)
      .find("td, th")
      .map((__, c) => $(c).text().replace(/\s+/g, " ").trim())
      .get();
    if (cells.length >= 2) rows.push(cells);
  });

  const rateFor = (match: RegExp): number | null => {
    for (const cells of rows) {
      if (!match.test(cells[0])) continue;
      // Use the first cell after the label that parses as a number.
      for (const cell of cells.slice(1)) {
        const v = parsePercentCell(cell);
        if (v != null) return v;
      }
    }
    return null;
  };

  const drafts: RawProductDraft[] = [];
  for (const ind of DEPOSIT_INDICATORS) {
    const rate = rateFor(ind.match);
    if (rate == null) continue; // indicator missing this run — skip, don't fabricate
    const tenor = TENURE_MONTHS[ind.slug];
    drafts.push({
      providerSlug: PROVIDER_SLUG,
      slug: ind.slug,
      name: ind.name,
      summary:
        `INDICATIVE benchmark deposit rate published by the Central Bank of ` +
        `Nigeria — a market reference for editors, not a provider product offer.`,
      interestRate: rate,
      minTenureMonths: tenor ?? null,
      maxTenureMonths: tenor ?? null,
      fees: [{ label: "Benchmark reference — no product fees", amount: 0 }],
      features: [`Source: ${SOURCE_LABEL}`, `Benchmark as of ${fetchedAt}`],
      sourceUrl,
      indicative: true,
      sourceLabel: SOURCE_LABEL,
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
      "Public-sector CBN statistical data; robots.txt permits /rates/*.html; " +
      "republished with attribution as INDICATIVE benchmarks.",
  },
  async run({ live }) {
    const today = new Date().toISOString().slice(0, 10);
    if (liveAllowed(cbnMoneyMarketAdapter, live)) {
      const res = await politeFetch(LIVE_URL);
      if (!res) return [];
      return parseHtml(await res.text(), LIVE_URL, today);
    }
    return parseHtml(
      readFileSync(FIXTURE, "utf8"),
      `${FIXTURE} (offline fixture)`,
      today,
    );
  },
};
