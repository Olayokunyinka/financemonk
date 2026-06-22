// REAL bank adapter — Access Bank (Nigeria) short-term personal lending.
//
//   Source:   https://www.accessbankplc.com/personal/borrowing/salary-advance
//   Provider: access-bank   Family: PERSONAL_LOAN
//   Emits:    indicative PERSONAL_LOAN drafts (interest, management fee + credit
//             life insurance, amount cap, tenor) parsed from the page's pricing
//             table — PayDay Loan, Small Ticket Personal Loan, Device Finance.
//
// LEGAL / ToS STATUS — tos.status = "approved" (live ENABLED):
//   Source terms reviewed and signed off 2026-06-22. robots.txt is absent (404)
//   so nothing is disallowed; politeFetch still enforces robots + a 1.5s/host
//   rate limit, and we fetch a single page per run.
//
// COMPARABILITY CAVEAT: Access Bank quotes interest on mixed bases ("7% Flat",
// "7% Monthly", "30% p.a."). We carry the stated number into aprMin/aprMax AND
// record the verbatim pricing string in features, but normalising flat/monthly
// vs p.a. to a true APR is a human QA step — hence everything is INDICATIVE.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Adapter, RawProductDraft, FeeItem } from "./types";
import { politeFetch, slugify, parseMoney } from "../lib/parse";
import { liveAllowed } from "../lib/source";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "access-bank-loans.html");
const LIVE_URL = "https://www.accessbankplc.com/personal/borrowing/salary-advance";
const SOURCE_LABEL = "Access Bank — Salary Advance pricing table";

// Collapse a cell's nested <div>/<span>/<br> markup to clean single-spaced text.
function cellText($el: cheerio.Cheerio<never>): string {
  $el.find("br").replaceWith(" ");
  return $el
    .text()
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// First "<number>%" after a label, tolerant of the page's "IInterest" typo and
// optional colon, e.g. matchPercent(txt, "interest rate").
function matchPercent(text: string, label: string): number | null {
  const m = text.match(new RegExp(`${label}\\s*:?\\s*([\\d.]+)\\s*%`, "i"));
  return m ? parseFloat(m[1]) : null;
}

// First naira figure in a string -> number (₦500,000 -> 500000).
function nairaCap(text: string): number | null {
  const m = text.match(/₦\s?([\d,]+)/);
  return m ? parseMoney(m[1]) : null;
}

// Tenor in months from a repayment-plan description.
function tenorMonths(text: string): number | null {
  const months = text.match(/(\d+)\s*month/i);
  if (months) return parseInt(months[1], 10);
  if (/twelve|12\s*month|365\s*days?|annual|year/i.test(text)) return 12;
  if (/30\s*days?|next salary|monthly/i.test(text)) return 1;
  return null;
}

function parseHtml(html: string, sourceUrl: string, fetchedAt: string): RawProductDraft[] {
  const $ = cheerio.load(html);

  // Locate the pricing table by its header labels (resilient to class churn).
  const $table = $("table")
    .filter((_, t) => /loan type/i.test($(t).text()) && /pricing/i.test($(t).text()))
    .first();
  if ($table.length === 0) return [];

  const drafts: RawProductDraft[] = [];
  let current: RawProductDraft | null = null;

  $table.find("tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length === 0) return;

    // Rows where the Loan Type cell rowspans get only 4 cells on continuation
    // rows; a 5-cell row starts a new product, a 4-cell row extends the last.
    const startsProduct = cells.length >= 5;
    const base = startsProduct ? 1 : 0; // first data column (after the name cell)
    const name = startsProduct
      ? cellText($(cells[0]) as cheerio.Cheerio<never>).replace(/\s*\(/g, " (")
      : "";

    const availTo = cellText($(cells[base]) as cheerio.Cheerio<never>);
    const amount = cellText($(cells[base + 1]) as cheerio.Cheerio<never>);
    const repay = cellText($(cells[base + 2]) as cheerio.Cheerio<never>);
    const pricing = cellText($(cells[base + 3]) as cheerio.Cheerio<never>);

    if (startsProduct) {
      if (!name) return;
      const apr = matchPercent(pricing, "interest rate");
      const mgmt = matchPercent(pricing, "management fee");
      const insurance = matchPercent(pricing, "credit life insurance");
      const fees: FeeItem[] = [];
      if (mgmt != null) fees.push({ label: "Management fee", amount: mgmt, unit: "%" });
      if (insurance != null)
        fees.push({ label: "Credit life insurance", amount: insurance, unit: "%" });

      current = {
        providerSlug: "access-bank",
        slug: slugify(name),
        name,
        summary:
          `INDICATIVE — Access Bank ${name}. Interest quoted as "${pricing}". ` +
          `Verify basis (flat/monthly/p.a.) before publishing.`,
        aprMin: apr,
        aprMax: apr,
        fees: fees.length ? fees : [{ label: "See pricing", amount: 0 }],
        minAmount: null,
        maxAmount: nairaCap(amount),
        minTenureMonths: tenorMonths(repay),
        maxTenureMonths: tenorMonths(repay),
        features: [
          availTo && `Eligibility: ${availTo}`,
          amount && `Loan amount: ${amount}`,
          repay && `Repayment: ${repay}`,
          pricing && `Pricing: ${pricing}`,
        ].filter(Boolean) as string[],
        sourceUrl,
        indicative: true,
        sourceLabel: SOURCE_LABEL,
        lastVerifiedAt: fetchedAt,
      };
      drafts.push(current);
    } else if (current) {
      // Continuation row (rowspan): don't fabricate a duplicate product — fold
      // its variant amount/eligibility into the current draft instead.
      const cap = nairaCap(amount);
      if (cap != null && (current.maxAmount == null || cap > current.maxAmount))
        current.maxAmount = cap;
      if (availTo)
        (current.features ??= []).push(
          `Also: ${availTo}${amount ? ` (${amount})` : ""}`,
        );
    }
  });

  return drafts;
}

export const accessBankLoansAdapter: Adapter = {
  id: "access-bank-loans",
  providerSlug: "access-bank",
  country: "ng",
  productType: "PERSONAL_LOAN",
  label: "Access Bank (NG short-term personal lending)",
  tos: {
    status: "approved",
    checkedAt: "2026-06-22",
    notes:
      "Source ToS reviewed and signed off 2026-06-22; robots.txt absent (nothing " +
      "disallowed). Figures are INDICATIVE — interest basis varies, QA normalises.",
  },
  async run({ live }) {
    const today = new Date().toISOString().slice(0, 10);
    if (liveAllowed(accessBankLoansAdapter, live)) {
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
