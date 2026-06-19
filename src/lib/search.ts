// Faceted search over products, using Postgres full-text search for the text
// query and structured Prisma filters for the facets. No external search
// engine (deferred). See PROJECT-SPEC "Search".

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { ProductType, ProviderType } from "@/generated/prisma/enums";
import type { FeeItem } from "@/lib/format";

export type SortKey = "relevance" | "rating" | "apr" | "fees" | "amount";

export type SearchFilters = {
  q?: string;
  productType?: ProductType;
  providerType?: ProviderType;
  amount?: number; // how much to borrow
  tenure?: number; // desired months
  maxApr?: number; // max interest p.a.
  useCase?: string; // a value from features[]
  noFees?: boolean;
  sort?: SortKey;
};

function maxFee(fees: unknown): number {
  const arr = Array.isArray(fees) ? (fees as FeeItem[]) : [];
  if (arr.length === 0) return 0;
  return Math.max(...arr.map((f) => f.amount ?? 0), 0);
}

export async function searchProducts(filters: SearchFilters) {
  const where: Prisma.ProductWhereInput = { live: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.productType) where.productType = filters.productType;
  if (filters.providerType) where.provider = { type: filters.providerType };
  if (filters.maxApr != null)
    and.push({
      OR: [{ aprMin: { lte: filters.maxApr } }, { aprMax: { lte: filters.maxApr } }],
    });
  if (filters.amount != null) {
    and.push({ OR: [{ minAmount: null }, { minAmount: { lte: filters.amount } }] });
    and.push({ OR: [{ maxAmount: null }, { maxAmount: { gte: filters.amount } }] });
  }
  if (filters.tenure != null) {
    and.push({
      OR: [{ minTenureMonths: null }, { minTenureMonths: { lte: filters.tenure } }],
    });
    and.push({
      OR: [{ maxTenureMonths: null }, { maxTenureMonths: { gte: filters.tenure } }],
    });
  }
  if (filters.useCase) where.features = { has: filters.useCase };
  if (and.length) where.AND = and;

  // Full-text search: get matching IDs ranked by relevance, then constrain.
  let rankOrder: string[] | null = null;
  const q = filters.q?.trim();
  if (q) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Product"
      WHERE "live" = true
        AND "searchVector" @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank("searchVector", websearch_to_tsquery('english', ${q})) DESC
    `;
    rankOrder = rows.map((r) => r.id);
    where.id = { in: rankOrder };
  }

  const sort = filters.sort ?? (q ? "relevance" : "rating");

  let products = await prisma.product.findMany({
    where,
    include: { provider: true },
    orderBy:
      sort === "apr"
        ? [{ sponsored: "desc" }, { aprMin: "asc" }]
        : sort === "amount"
          ? [{ sponsored: "desc" }, { minAmount: "asc" }]
          : [{ sponsored: "desc" }, { ratingAggregate: "desc" }],
  });

  // Fee facet + fee sort happen in JS (fees is itemised JSON).
  if (filters.noFees) products = products.filter((p) => maxFee(p.fees) === 0);
  if (sort === "fees") {
    products = [...products].sort((a, b) => {
      if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
      return maxFee(a.fees) - maxFee(b.fees);
    });
  }

  // Relevance order (only meaningful with a text query): keep FTS rank, but
  // still float sponsored rows to the top (labelled).
  if (sort === "relevance" && rankOrder) {
    const pos = new Map(rankOrder.map((id, i) => [id, i]));
    products = [...products].sort((a, b) => {
      if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
      return (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0);
    });
  }

  return products;
}

// Distinct facet option values for the current product set (drives the filter
// UI). Cheap at MVP scale.
export async function getFacetOptions(productType?: ProductType) {
  const products = await prisma.product.findMany({
    where: { live: true, ...(productType ? { productType } : {}) },
    select: { features: true, provider: { select: { type: true } } },
  });
  const providerTypes = Array.from(
    new Set(products.map((p) => p.provider.type)),
  ).sort();
  const useCases = Array.from(
    new Set(products.flatMap((p) => p.features)),
  ).sort();
  return { providerTypes, useCases };
}
