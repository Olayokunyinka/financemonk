// Core ingestion pipeline, callable from the CLI (ingestion/run.ts) and the
// scheduled refresh route (/api/cron/refresh). Runs adapters -> normalise ->
// diff vs live Product -> stage ProductDraft rows under one IngestionRun.
// Nothing is published here; an admin approves drafts in /admin/ingestion.

import type { PrismaClient } from "../src/generated/prisma/client";
import { ProductType } from "../src/generated/prisma/enums";
import { normalizeDraft } from "./normalize";
import type { Adapter, RawProductDraft } from "./adapters/types";
import { exampleBankAdapter } from "./adapters/example-bank";
import { exampleRatecardAdapter } from "./adapters/example-ratecard";

export const ADAPTERS: Adapter[] = [exampleBankAdapter, exampleRatecardAdapter];

const CURRENCY: Record<string, string> = { ng: "NGN", ke: "KES", za: "ZAR" };

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

export type RunSummary = {
  runId: string;
  adapters: string[];
  created: number;
  changed: number;
  unchanged: number;
  errors: number;
};

export async function runIngestion(
  prisma: PrismaClient,
  opts: { live?: boolean; adapterId?: string } = {},
): Promise<RunSummary> {
  const live = !!opts.live;
  const selected = opts.adapterId
    ? ADAPTERS.filter((a) => a.id === opts.adapterId)
    : ADAPTERS;
  if (selected.length === 0)
    throw new Error(
      `No adapter matches "${opts.adapterId}". Known: ${ADAPTERS.map((a) => a.id).join(", ")}`,
    );

  // Fresh queue: clear prior pending drafts so the QA list isn't a pile-up.
  await prisma.productDraft.deleteMany({ where: { status: "PENDING" } });

  const run = await prisma.ingestionRun.create({
    data: { adapter: opts.adapterId ?? "all" },
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

    for (const raw of raws) {
      const { value, issues } = normalizeDraft(raw);
      const existing = await prisma.product.findUnique({
        where: { slug: value.slug },
      });

      const diff: Record<string, { from: unknown; to: unknown }> = {};
      if (existing) {
        for (const f of COMPARABLE) {
          const before = (existing as Record<string, unknown>)[f] ?? null;
          const after = (value as Record<string, unknown>)[f] ?? null;
          // Preserve-on-missing: a field the adapter didn't supply is not a
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

  return {
    runId: run.id,
    adapters: selected.map((a) => a.id),
    created,
    changed,
    unchanged,
    errors,
  };
}
