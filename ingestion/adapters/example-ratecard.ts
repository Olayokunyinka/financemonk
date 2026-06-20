// PDF adapter example (feeds the `renmoney` provider, NG personal loans) from a
// rate-card PDF — the common case where providers publish rates as a PDF.
//
// Offline (default): parses ingestion/fixtures/example-ratecard.pdf.
// Live (--live): would fetch the provider's real rate-card PDF (robots-checked).

import { join } from "node:path";
import type { Adapter, RawProductDraft, FeeItem } from "./types";
import { extractPdfText } from "../lib/pdf";
import { parsePercentRange, parseRange, politeFetch } from "../lib/parse";

const FIXTURE = join(process.cwd(), "ingestion", "fixtures", "example-ratecard.pdf");
const LIVE_URL = "https://renmoney.com/rates.pdf"; // illustrative

function field(block: string, label: string): string | null {
  const m = block.match(new RegExp(`${label}:\\s*(.+)`, "i"));
  return m ? m[1].trim() : null;
}

function parseText(text: string, sourceUrl: string): RawProductDraft[] {
  const drafts: RawProductDraft[] = [];
  // Each product block starts with "Product:" — split and keep the prefix.
  const blocks = text
    .split(/(?=Product:)/)
    .map((b) => b.trim())
    .filter((b) => b.startsWith("Product:"));

  for (const block of blocks) {
    const header = field(block, "Product");
    if (!header) continue;
    const [namePart, slugPart] = header.split("|");
    const name = namePart.trim();
    const slug = (slugPart?.match(/slug:\s*([a-z0-9-]+)/i)?.[1] ?? "").trim();
    if (!name || !slug) continue;

    const [aprMin, aprMax] = parsePercentRange(field(block, "Interest") ?? "");
    const [minAmount, maxAmount] = parseRange(field(block, "Amount") ?? "");
    const [minTenure, maxTenure] = parseRange(field(block, "Tenure") ?? "");
    const feePct = field(block, "Management fee")
      ? parsePercentRange(field(block, "Management fee")!)[0]
      : null;
    const fees: FeeItem[] =
      feePct && feePct > 0
        ? [{ label: "Management fee", amount: feePct, unit: "%" }]
        : [{ label: "No management fee", amount: 0 }];

    drafts.push({
      providerSlug: "renmoney",
      slug,
      name,
      aprMin,
      aprMax,
      fees,
      minAmount,
      maxAmount,
      minTenureMonths: minTenure,
      maxTenureMonths: maxTenure,
      sourceUrl,
    });
  }
  return drafts;
}

export const exampleRatecardAdapter: Adapter = {
  id: "example-ratecard",
  providerSlug: "renmoney",
  country: "ng",
  productType: "PERSONAL_LOAN",
  label: "Example Rate Card (PDF)",
  async run({ live }) {
    if (live) {
      const res = await politeFetch(LIVE_URL);
      if (!res) return [];
      const buf = Buffer.from(await res.arrayBuffer());
      return parseText(await extractPdfText(buf), LIVE_URL);
    }
    return parseText(
      await extractPdfText(FIXTURE),
      `${FIXTURE} (offline fixture)`,
    );
  },
};
