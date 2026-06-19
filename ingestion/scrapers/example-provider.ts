// EXAMPLE scraper — proves the ingestion pipeline for ONE provider rate page.
//
// This is deliberately a single-provider demonstration, not the full
// multi-provider pipeline (that is a later phase). It shows the shape every
// real adapter will follow:
//   1. Check robots.txt and respect it.
//   2. Fetch the provider's rate/product page.
//   3. Parse the HTML with Cheerio and extract comparable terms.
//   4. Normalise into our Product seed shape.
//   5. Write the result to a JSON file under ingestion/seed/ (a human reviews
//      it before it is merged into the real seed and loaded by prisma/seed.ts).
//
// Run with:  npm run scrape:example -- <url>
// If no URL is given it runs in OFFLINE demo mode against a bundled HTML sample,
// so it works with no network and without hitting anyone's site.
//
// Ingestion is intentionally separate from the web app: it never imports app
// code beyond plain types, and it writes data, it does not serve it.

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

type ScrapedProduct = {
  slug: string;
  name: string;
  providerSlug: string;
  summary: string;
  aprMin: number | null;
  aprMax: number | null;
  fees: { label: string; amount: number; unit?: string }[];
  minAmount: number | null;
  maxAmount: number | null;
  minTenureMonths: number | null;
  maxTenureMonths: number | null;
  sourceRefs: { label: string; url: string }[];
  scrapedAt: string;
};

// A tiny offline HTML sample resembling a provider rate card, so the demo is
// deterministic and network-free.
const OFFLINE_SAMPLE_HTML = `
<html><body>
  <main>
    <h1 class="product-name">Example Bank QuickLoan</h1>
    <p class="summary">Fast personal loan for salary earners.</p>
    <table class="rates">
      <tr><th>Interest (p.a.)</th><td>18% - 24%</td></tr>
      <tr><th>Management fee</th><td>1%</td></tr>
      <tr><th>Loan amount</th><td>₦50,000 - ₦5,000,000</td></tr>
      <tr><th>Tenure</th><td>6 - 24 months</td></tr>
    </table>
  </main>
</body></html>`;

const USER_AGENT = "FinCompareAfricaBot/0.1 (+https://fincompare.africa/bot)";

// Minimal robots.txt check: fetch /robots.txt and look for a Disallow that
// would block our path for "*". This is a pragmatic check, not a full parser.
async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const u = new URL(targetUrl);
    const robotsUrl = `${u.origin}/robots.txt`;
    const res = await fetch(robotsUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return true; // no robots.txt => allowed
    const text = await res.text();
    // Very small parser: collect Disallow lines under User-agent: *
    const lines = text.split("\n").map((l) => l.trim());
    let inStar = false;
    const disallows: string[] = [];
    for (const line of lines) {
      if (/^user-agent:/i.test(line)) inStar = /\*\s*$/.test(line);
      else if (inStar && /^disallow:/i.test(line)) {
        const path = line.split(":")[1]?.trim() ?? "";
        if (path) disallows.push(path);
      }
    }
    return !disallows.some((d) => u.pathname.startsWith(d));
  } catch {
    return true;
  }
}

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[, ]/g, "");
  // A k/m suffix only counts as a multiplier when it is NOT part of a word
  // (so "24months" -> 24, but "5m" -> 5,000,000).
  const withSuffix = cleaned.match(/([0-9]+(?:\.[0-9]+)?)([mk])(?![a-z])/i);
  if (withSuffix) {
    const n = parseFloat(withSuffix[1]);
    return /m/i.test(withSuffix[2]) ? n * 1_000_000 : n * 1_000;
  }
  const plain = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/);
  return plain ? parseFloat(plain[1]) : null;
}

function parseRange(s: string): [number | null, number | null] {
  const parts = s.split(/[-–]/).map((p) => p.trim());
  if (parts.length >= 2) return [parseMoney(parts[0]), parseMoney(parts[1])];
  const one = parseMoney(s);
  return [one, one];
}

function extract(html: string, sourceUrl: string): ScrapedProduct {
  const $ = cheerio.load(html);
  const name = $(".product-name").first().text().trim() || "Unknown product";
  const summary = $(".summary").first().text().trim();

  const cells: Record<string, string> = {};
  $("table.rates tr").each((_, tr) => {
    const key = $(tr).find("th").text().trim().toLowerCase();
    const val = $(tr).find("td").text().trim();
    if (key) cells[key] = val;
  });

  const [aprMin, aprMax] = parseRange(cells["interest (p.a.)"] ?? "");
  const [minAmount, maxAmount] = parseRange(cells["loan amount"] ?? "");
  const [minTenure, maxTenure] = parseRange(cells["tenure"] ?? "");
  const feeRaw = cells["management fee"];
  const feeVal = feeRaw ? parseMoney(feeRaw) : null;

  return {
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    providerSlug: "example-bank",
    summary,
    aprMin,
    aprMax,
    fees: feeVal != null ? [{ label: "Management fee", amount: feeVal, unit: "%" }] : [],
    minAmount,
    maxAmount,
    minTenureMonths: minTenure,
    maxTenureMonths: maxTenure,
    sourceRefs: [{ label: name, url: sourceUrl }],
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
  const url = process.argv[2];
  let html: string;
  let sourceUrl: string;

  if (!url) {
    console.log("ℹ  No URL given — running OFFLINE demo against bundled sample.");
    html = OFFLINE_SAMPLE_HTML;
    sourceUrl = "https://example.com/loans (offline sample)";
  } else {
    console.log(`→ Checking robots.txt for ${url} …`);
    const allowed = await isAllowedByRobots(url);
    if (!allowed) {
      console.error("✗ Blocked by robots.txt — aborting. We respect robots.txt.");
      process.exit(1);
    }
    console.log("✓ Allowed by robots.txt. Fetching …");
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      console.error(`✗ Fetch failed: HTTP ${res.status}`);
      process.exit(1);
    }
    html = await res.text();
    sourceUrl = url;
  }

  const product = extract(html, sourceUrl);
  const outPath = join(process.cwd(), "ingestion", "seed", "scraped.example.json");
  writeFileSync(outPath, JSON.stringify([product], null, 2));

  console.log("\nExtracted product:");
  console.log(JSON.stringify(product, null, 2));
  console.log(`\n✅ Wrote ${outPath}`);
  console.log(
    "   Review it, then (in a real run) fold it into products.*.json and run `npm run seed`.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
