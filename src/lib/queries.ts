// Data-access layer. All DB reads for the public pages live here so the page
// components stay thin and the thin-content / freshness rules are centralised.

import { prisma } from "@/lib/prisma";
import { HUB_MIN_PRODUCTS } from "@/lib/site";
import { getCountry, familyByType, type Country, type Family } from "@/lib/taxonomy";
import type { ProductType } from "@/generated/prisma/enums";

// All editorial hubs that resolve to a known country + family. Drives the
// homepage link mesh, footer, sitemap and hub static generation — so only real
// slices are linked/indexed (no empty cartesian combos).
export async function listHubs(): Promise<
  { country: Country; family: Family; title: string }[]
> {
  const hubs = await prisma.hub.findMany({ orderBy: { country: "asc" } });
  const out: { country: Country; family: Family; title: string }[] = [];
  for (const h of hubs) {
    const country = getCountry(h.country);
    const family = familyByType(h.productType);
    if (country && family) out.push({ country, family, title: h.title });
  }
  return out;
}

// Product shape with its provider joined — used everywhere a row/card renders.
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { provider: true },
  });
}

export async function getHub(country: string, productType: ProductType) {
  return prisma.hub.findUnique({
    where: { country_productType: { country, productType } },
  });
}

// Live products for a hub, sponsored first then by rating, used to render the
// comparison table. Sorting/filtering beyond this default happens client-side.
export async function getHubProducts(country: string, productType: ProductType) {
  return prisma.product.findMany({
    where: { country, productType, live: true },
    include: { provider: true },
    orderBy: [{ sponsored: "desc" }, { ratingAggregate: "desc" }],
  });
}

// Alternatives = other live products in the same family + country, ranked,
// excluding the current product. Mandatory block on every product page.
export async function getAlternatives(
  country: string,
  productType: ProductType,
  excludeSlug: string,
  limit = 4,
) {
  return prisma.product.findMany({
    where: { country, productType, live: true, slug: { not: excludeSlug } },
    include: { provider: true },
    orderBy: [{ ratingAggregate: "desc" }],
    take: limit,
  });
}

// Featured/verified products for the homepage. Verified (gold-eligible) and
// sponsored first. Sponsored rows are labelled in the UI.
export async function getFeaturedProducts(limit = 4) {
  return prisma.product.findMany({
    where: { live: true },
    include: { provider: true },
    orderBy: [
      { sponsored: "desc" },
      { ratingAggregate: "desc" },
      { reviewCount: "desc" },
    ],
    take: limit,
  });
}

export async function getPublishedReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
}

// THIN-CONTENT RULE (enforced in code): a comparison hub is indexable only when
// it has >= HUB_MIN_PRODUCTS live products AND a unique editorial intro.
// Otherwise the page still renders (so it isn't broken) but is marked noindex.
export function hubIsIndexable(
  hub: { intro: string | null } | null,
  liveProductCount: number,
): boolean {
  const hasUniqueIntro = !!hub?.intro && hub.intro.trim().length >= 200;
  return hasUniqueIntro && liveProductCount >= HUB_MIN_PRODUCTS;
}

export type ProductWithProvider = Awaited<
  ReturnType<typeof getProductBySlug>
> extends infer T
  ? T extends null
    ? never
    : T
  : never;
