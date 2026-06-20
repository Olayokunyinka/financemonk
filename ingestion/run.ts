// Ingestion pipeline runner (M6).
//
//   npm run ingest                 # all adapters, offline fixtures
//   npm run ingest -- --adapter=example-bank
//   npm run ingest -- --live       # fetch real sources (respects robots.txt)
//
// Runs adapters -> normalises -> diffs each draft against the live Product (by
// slug) -> writes ProductDraft rows under one IngestionRun. NOTHING is published
// here; an admin approves drafts in /admin/ingestion.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ProductType } from "../src/generated/prisma/enums";
import { normalizeDraft } from "./normalize";
import type { Adapter, RawProductDraft } from "./adapters/types";
import { exampleBankAdapter } from "./adapters/example-bank";
import { exampleRatecardAdapter } from "./adapters/example-ratecard";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADAPTERS: Adapter[] = [exampleBankAdapter, exampleRatecardAdapter];
const CURRENCY: Record<string, string> = { ng: "NGN", ke: "KES", za: "ZAR" };

// Comparable fields we diff (and that publishing will write).
const COMPARABLE = [
  "name",
  "summary",
  "aprMin",
  "aprMax",
  "interestRate",
  "minAmount",
  "maxAmount",
  "minTenureMonths",
  "maxTenureMonths",
] as const;

function feesKey(fees: unknown): string {
  return JSON.stringify(fees ?? []);
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const only = args.find((a) => a.startsWith("--adapter="))?.split("=")[1];
  const selected = only ? ADAPTERS.filter((a) => a.id === only) : ADAPTERS;

  if (selected.length === 0) {
    console.error(`No adapter matches "${only}". Known: ${ADAPTERS.map((a) => a.id).join(", ")}`);
    process.exit(1);
  }

  console.log(
    `→ Ingestion run (${live ? "LIVE" : "offline fixtures"}): ${selected
      .map((a) => a.id)
      .join(", ")}`,
  );

  // Fresh queue: clear any prior pending drafts so the QA list isn't a pile-up.
  await prisma.productDraft.deleteMany({ where: { status: "PENDING" } });

  const run = await prisma.ingestionRun.create({
    data: { adapter: only ?? "all" },
  });

  let created = 0;
  let changed = 0;
  let unchanged = 0;
  let errors = 0;

  for (const ad of selected) {
    let raws: RawProductDraft[] = [];
    try {
      raws = await ad.run({ live });
    } catch (e) {
      errors++;
      console.warn(`  ✗ adapter ${ad.id} failed:`, (e as Error).message);
      continue;
    }
    console.log(`  • ${ad.id}: ${raws.length} product(s)`);

    for (const raw of raws) {
      const { value, issues } = normalizeDraft(raw);
      const existing = await prisma.product.findUnique({
        where: { slug: value.slug },
      });

      // Compute change kind + field-level diff vs the live product.
      const diff: Record<string, { from: unknown; to: unknown }> = {};
      if (existing) {
        for (const f of COMPARABLE) {
          const before = (existing as Record<string, unknown>)[f] ?? null;
          const after = (value as Record<string, unknown>)[f] ?? null;
          // Preserve-on-missing: a field the adapter didn't supply is NOT a
          // change (publishing leaves the curated value intact).
          if (after === null || after === "") continue;
          if (JSON.stringify(before) !== JSON.stringify(after))
            diff[f] = { from: before, to: after };
        }
        const incomingFees = value.fees ?? [];
        if (incomingFees.length > 0 && feesKey(existing.fees) !== feesKey(incomingFees))
          diff["fees"] = { from: existing.fees, to: incomingFees };
      }
      const changeKind = !existing
        ? "NEW"
        : Object.keys(diff).length > 0
          ? "CHANGED"
          : "UNCHANGED";
      if (changeKind === "NEW") created++;
      else if (changeKind === "CHANGED") changed++;
      else unchanged++;

      await prisma.productDraft.create({
        data: {
          runId: run.id,
          providerSlug: value.providerSlug,
          productSlug: value.slug,
          country: ad.country,
          productType: ProductType[ad.productType],
          name: value.name,
          summary: value.summary ?? null,
          aprMin: value.aprMin ?? null,
          aprMax: value.aprMax ?? null,
          interestRate: value.interestRate ?? null,
          fees: (value.fees ?? []) as object,
          minAmount: value.minAmount ?? null,
          maxAmount: value.maxAmount ?? null,
          currency: CURRENCY[ad.country] ?? "NGN",
          minTenureMonths: value.minTenureMonths ?? null,
          maxTenureMonths: value.maxTenureMonths ?? null,
          eligibility: value.eligibility ?? [],
          requiredDocs: value.requiredDocs ?? [],
          features: value.features ?? [],
          sourceUrl: value.sourceUrl ?? null,
          changeKind,
          diff: diff as object,
          issues,
        },
      });
    }
  }

  await prisma.ingestionRun.update({
    where: { id: run.id },
    data: { created, changed, unchanged, errors, finishedAt: new Date() },
  });

  console.log(
    `✅ Run complete: ${created} new, ${changed} changed, ${unchanged} unchanged, ${errors} errors.`,
  );
  console.log("   Review & approve at /admin/ingestion");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
