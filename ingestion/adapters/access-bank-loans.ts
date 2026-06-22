// REAL bank adapter — Access Bank (Nigeria) personal-loan rate page (HTML).
//
//   Source:  https://www.accessbankplc.com (personal lending rate page)
//   Provider: access-bank   Family: PERSONAL_LOAN
//   Emits:   indicative PERSONAL_LOAN drafts (apr, management fee, amount range,
//            tenor) parsed from product cards on the rate page.
//
// LEGAL / ToS STATUS — tos.status = "pending-review" (live DISABLED):
//   The parser and robots/rate-limit plumbing are complete and tested offline,
//   but Access Bank's website Terms of Use have NOT yet been reviewed to confirm
//   automated retrieval is permitted. Until a human flips this to "approved",
//   liveAllowed() forces --live back to the offline fixture and logs a warning.
//   Do NOT change tos.status without that sign-off (see PROJECT-SPEC guardrails).
//
// When approved, this is the template every Nigerian bank rate page follows:
// copy the file, set provider/URL/selectors, review ToS, set status "approved".

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Adapter, RawProductDraft, FeeItem } from "./types";
import { parsePercentRange, parseRange, politeFetch, slugify } from "../lib/parse";
import { liveAllowed } from "../lib/source";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "access-bank-loans.html");
const LIVE_URL = "https://www.accessbankplc.com/personal/loans";
const SOURCE_LABEL = "Access Bank personal lending rate page";

// Read a labelled term ("Interest", "Amount", ...) from a card's <dl> or table,
// matching the label text case-insensitively so markup variations still parse.
function term(labels: Map<string, string>, key: string): string {
  for (const [k, v] of labels) if (k.includes(key)) return v;
  return "";
}

function collectLabels($: cheerio.CheerioAPI, $card: cheerio.Cheerio<never>): Map<string, string> {
  const out = new Map<string, string>();
  // <dl><dt>label</dt><dd>value</dd>
  $card.find("dl dt").each((_, dt) => {
    const key = $(dt).text().trim().toLowerCase();
    const val = $(dt).next("dd").text().trim();
    if (key) out.set(key, val);
  });
  // <table><tr><th>label</th><td>value</td></tr> (fallback shape)
  $card.find("table tr").each((_, tr) => {
    const key = $(tr).find("th").text().trim().toLowerCase();
    const val = $(tr).find("td").text().trim();
    if (key) out.set(key, val);
  });
  return out;
}

function parseHtml(html: string, sourceUrl: string, fetchedAt: string): RawProductDraft[] {
  const $ = cheerio.load(html);
  const drafts: RawProductDraft[] = [];

  $(".product-card").each((_, el) => {
    const $card = $(el) as cheerio.Cheerio<never>;
    const name = $card.find(".product-name").first().text().trim();
    if (!name) return;
    const slug = ($card.attr("data-slug")?.trim() || slugify(name)) ?? "";

    const labels = collectLabels($, $card);
    const [aprMin, aprMax] = parsePercentRange(term(labels, "interest"));
    const [minAmount, maxAmount] = parseRange(term(labels, "amount"));
    const [minTenure, maxTenure] = parseRange(term(labels, "tenure"));

    const feePct = term(labels, "management fee")
      ? parsePercentRange(term(labels, "management fee"))[0]
      : null;
    const fees: FeeItem[] =
      feePct && feePct > 0
        ? [{ label: "Management fee", amount: feePct, unit: "%" }]
        : [{ label: "No management fee", amount: 0 }];

    const features = $card
      .find(".product-features li")
      .map((__, li) => $(li).text().trim())
      .get();

    drafts.push({
      providerSlug: "access-bank",
      slug,
      name,
      summary: $card.find(".product-summary").first().text().trim() || undefined,
      aprMin,
      aprMax,
      fees,
      minAmount,
      maxAmount,
      minTenureMonths: minTenure,
      maxTenureMonths: maxTenure,
      features,
      sourceUrl,
      indicative: true,
      sourceLabel: SOURCE_LABEL,
      lastVerifiedAt: fetchedAt,
    });
  });

  return drafts;
}

export const accessBankLoansAdapter: Adapter = {
  id: "access-bank-loans",
  providerSlug: "access-bank",
  country: "ng",
  productType: "PERSONAL_LOAN",
  label: "Access Bank (NG personal loans)",
  tos: {
    status: "pending-review",
    checkedAt: "2026-06-21",
    notes:
      "Website Terms of Use not yet reviewed for automated retrieval — live " +
      "fetching disabled until a human signs off.",
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
