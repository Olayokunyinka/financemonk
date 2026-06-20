// Maps a Prisma product (+provider) into a plain, serializable row for client
// components (comparison table, search results, compare view). Display strings
// are computed on the server; numeric sort keys travel alongside.

import { resolveBadge } from "@/lib/verification";
import {
  formatApr,
  formatTenure,
  formatAmountRange,
  feesSummary,
  currencySymbol,
  type FeeItem,
} from "@/lib/format";
import { buildMetrics, kindOfType } from "@/lib/families/registry";

type ProductWithProvider = {
  slug: string;
  name: string;
  summary: string | null;
  productType: string;
  aprMin: number | null;
  aprMax: number | null;
  interestRate: number | null;
  fees: unknown;
  minAmount: number | null;
  maxAmount: number | null;
  currency: string;
  minTenureMonths: number | null;
  maxTenureMonths: number | null;
  terms?: unknown;
  ratingAggregate: number;
  reviewCount: number;
  lastVerifiedAt: Date;
  sponsored: boolean;
  verificationBadge: "UNVERIFIED" | "POPULARITY_VERIFIED" | "PROVIDER_VERIFIED";
  features: string[];
  provider: {
    name: string;
    type: string;
    licensed: boolean;
    claimed: boolean;
    licenseSource: string | null;
  };
};

export type ProductRow = {
  slug: string;
  name: string;
  summary: string;
  providerName: string;
  providerType: string;
  badgeTier: "gold" | "grey" | "none";
  badgeLabel: string;
  badgeBasis: string;
  aprText: string;
  aprSort: number;
  feesText: string;
  feesSort: number;
  amountText: string;
  minAmountSort: number;
  tenureText: string;
  rating: number;
  reviewCount: number;
  lastVerifiedISO: string;
  sponsored: boolean;
  keyFeature: string;
  // Family-specific comparable metrics (label/value), driving the comparison
  // table columns + product term rows. A hub is one family so labels are shared.
  metrics: { label: string; value: string }[];
};

function minFee(fees: unknown): number {
  const arr = Array.isArray(fees) ? (fees as FeeItem[]) : [];
  if (arr.length === 0) return 0;
  const amounts = arr.map((f) => f.amount ?? 0);
  return Math.max(...amounts, 0);
}

export function toRow(p: ProductWithProvider): ProductRow {
  const badge = resolveBadge({
    verificationBadge: p.verificationBadge,
    licensed: p.provider.licensed,
    claimed: p.provider.claimed,
    licenseSource: p.provider.licenseSource,
  });
  return {
    slug: p.slug,
    name: p.name,
    summary: p.summary ?? "",
    providerName: p.provider.name,
    providerType: p.provider.type,
    badgeTier: badge.tier,
    badgeLabel: badge.label,
    badgeBasis: badge.basis,
    // Loans show APR; deposit products (no APR) show their interest rate.
    aprText:
      p.aprMin != null || p.aprMax != null
        ? formatApr(p.aprMin, p.aprMax)
        : p.interestRate != null
          ? `${p.interestRate}%`
          : "—",
    aprSort: p.aprMin ?? p.aprMax ?? p.interestRate ?? Number.POSITIVE_INFINITY,
    feesText: feesSummary(p.fees),
    feesSort: minFee(p.fees),
    amountText: formatAmountRange(
      p.minAmount,
      p.maxAmount,
      currencySymbol(p.currency),
    ),
    minAmountSort: p.minAmount ?? Number.POSITIVE_INFINITY,
    tenureText: formatTenure(p.minTenureMonths, p.maxTenureMonths),
    rating: p.ratingAggregate,
    reviewCount: p.reviewCount,
    lastVerifiedISO: p.lastVerifiedAt.toISOString(),
    sponsored: p.sponsored,
    keyFeature: p.features[0] ?? "",
    metrics: buildMetrics(kindOfType(p.productType), {
      aprMin: p.aprMin,
      aprMax: p.aprMax,
      interestRate: p.interestRate,
      fees: p.fees,
      minAmount: p.minAmount,
      maxAmount: p.maxAmount,
      minTenureMonths: p.minTenureMonths,
      maxTenureMonths: p.maxTenureMonths,
      currency: p.currency,
      terms: p.terms ?? {},
    }),
  };
}
