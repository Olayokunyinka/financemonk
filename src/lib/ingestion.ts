// Server-side helpers for the ingestion QA queue (M6). Reads runs/drafts and
// publishes an approved draft into the live Product table.

import { prisma } from "@/lib/prisma";
import { recomputeProviderBadges } from "@/lib/providers";
import { DisclaimerState } from "@/generated/prisma/enums";

export async function getRuns(limit = 5) {
  return prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getPendingDrafts() {
  const drafts = await prisma.productDraft.findMany({
    where: { status: "PENDING" },
    orderBy: [{ changeKind: "asc" }, { name: "asc" }],
  });
  // CHANGED + NEW first (more interesting than UNCHANGED).
  const order: Record<string, number> = { CHANGED: 0, NEW: 1, UNCHANGED: 2 };
  return drafts.sort(
    (a, b) => (order[a.changeKind] ?? 9) - (order[b.changeKind] ?? 9),
  );
}

export type PublishResult =
  | { ok: true; slug: string; created: boolean }
  | { ok: false; reason: string };

// Publish a draft -> upsert the live Product. Machine-ingested figures are
// INDICATIVE with a fresh lastVerifiedAt + source attribution. Provider-owned
// state (claimed/sponsored/ratings) is preserved; badges are recomputed so the
// gold rule (licensed AND claimed) still decides.
export async function publishDraft(draftId: string): Promise<PublishResult> {
  const draft = await prisma.productDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, reason: "Draft not found" };
  if (draft.status !== "PENDING")
    return { ok: false, reason: "Draft already processed" };

  const provider = await prisma.provider.findUnique({
    where: { slug: draft.providerSlug },
  });
  if (!provider)
    return { ok: false, reason: `Unknown provider "${draft.providerSlug}"` };

  const sourceRefs = draft.sourceUrl
    ? [{ label: "Ingested source", url: draft.sourceUrl }]
    : [];

  const existing = await prisma.product.findUnique({
    where: { slug: draft.productSlug },
  });

  // Always-written freshness/provenance fields.
  const meta = {
    lastVerifiedAt: new Date(),
    disclaimerState: DisclaimerState.INDICATIVE,
    sourceRefs: sourceRefs as object,
  };

  // PRESERVE-ON-MISSING: only overwrite a field the adapter actually supplied,
  // so an adapter that omits (e.g.) summary or eligibility never wipes curated
  // data. Numeric 0 and explicit values are kept; null/empty are treated as
  // "not provided".
  const provided = {
    name: draft.name,
    ...(draft.summary ? { summary: draft.summary } : {}),
    ...(draft.aprMin != null ? { aprMin: draft.aprMin } : {}),
    ...(draft.aprMax != null ? { aprMax: draft.aprMax } : {}),
    ...(draft.interestRate != null ? { interestRate: draft.interestRate } : {}),
    ...(Array.isArray(draft.fees) && (draft.fees as unknown[]).length
      ? { fees: draft.fees as object }
      : {}),
    ...(draft.minAmount != null ? { minAmount: draft.minAmount } : {}),
    ...(draft.maxAmount != null ? { maxAmount: draft.maxAmount } : {}),
    ...(draft.minTenureMonths != null
      ? { minTenureMonths: draft.minTenureMonths }
      : {}),
    ...(draft.maxTenureMonths != null
      ? { maxTenureMonths: draft.maxTenureMonths }
      : {}),
    ...(draft.eligibility.length ? { eligibility: draft.eligibility } : {}),
    ...(draft.requiredDocs.length ? { requiredDocs: draft.requiredDocs } : {}),
    ...(draft.features.length ? { features: draft.features } : {}),
  };

  let created = false;
  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: { ...provided, ...meta },
    });
  } else {
    created = true;
    await prisma.product.create({
      data: {
        slug: draft.productSlug,
        productType: draft.productType,
        country: draft.country,
        providerId: provider.id,
        currency: draft.currency,
        live: true,
        ...provided,
        ...meta,
      },
    });
  }

  await recomputeProviderBadges(provider.id);
  await prisma.productDraft.update({
    where: { id: draftId },
    data: { status: "APPROVED" },
  });

  return { ok: true, slug: draft.productSlug, created };
}
