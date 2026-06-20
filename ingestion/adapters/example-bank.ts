// HTML adapter example (feeds the `gtbank` provider, NG personal loans).
//
// Offline (default): parses ingestion/fixtures/example-bank.html.
// Live (--live): would fetch the provider's real rate page (robots-checked).
// A real provider adapter is just a new file like this with the right selectors.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import type { Adapter, RawProductDraft, FeeItem } from "./types";
import { parsePercentRange, parseRange, politeFetch } from "../lib/parse";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "example-bank.html");
const LIVE_URL = "https://www.gtbank.com/personal-banking/loans"; // illustrative

function parseHtml(html: string, sourceUrl: string): RawProductDraft[] {
  const $ = cheerio.load(html);
  const drafts: RawProductDraft[] = [];

  $("section.product").each((_, el) => {
    const $el = $(el);
    const slug = $el.attr("data-slug")?.trim();
    const name = $el.find(".name").first().text().trim();
    if (!slug || !name) return;

    const cells: Record<string, string> = {};
    $el.find("table.terms tr").each((__, tr) => {
      const key = $(tr).find("th").text().trim().toLowerCase();
      const val = $(tr).find("td").text().trim();
      if (key) cells[key] = val;
    });

    const [aprMin, aprMax] = parsePercentRange(cells["interest"] ?? "");
    const [minAmount, maxAmount] = parseRange(cells["amount"] ?? "");
    const [minTenure, maxTenure] = parseRange(cells["tenure"] ?? "");

    const feePct = cells["management fee"]
      ? parsePercentRange(cells["management fee"])[0]
      : null;
    const fees: FeeItem[] =
      feePct && feePct > 0
        ? [{ label: "Management fee", amount: feePct, unit: "%" }]
        : [{ label: "No management fee", amount: 0 }];

    const features = $el
      .find("ul.features li")
      .map((__, li) => $(li).text().trim())
      .get();

    drafts.push({
      providerSlug: "gtbank",
      slug,
      name,
      summary: $el.find(".summary").first().text().trim() || undefined,
      aprMin,
      aprMax,
      fees,
      minAmount,
      maxAmount,
      minTenureMonths: minTenure,
      maxTenureMonths: maxTenure,
      features,
      sourceUrl,
    });
  });

  return drafts;
}

export const exampleBankAdapter: Adapter = {
  id: "example-bank",
  providerSlug: "gtbank",
  country: "ng",
  productType: "PERSONAL_LOAN",
  label: "Example Bank (HTML rate page)",
  async run({ live }) {
    if (live) {
      const res = await politeFetch(LIVE_URL);
      if (!res) return [];
      return parseHtml(await res.text(), LIVE_URL);
    }
    return parseHtml(readFileSync(FIXTURE, "utf8"), `${FIXTURE} (offline fixture)`);
  },
};
