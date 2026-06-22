import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import {
  getHub,
  getHubProducts,
  hubIsIndexable,
  listHubs,
} from "@/lib/queries";
import { calculatorFor } from "@/lib/taxonomy";

export const revalidate = 3600;

// Single sitemap for Phase 0. As coverage grows this is the place to segment
// (e.g. per-country / per-family child sitemaps via generateSitemaps).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE.url}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const hubs = await listHubs();

  // Country landing pages (one per country that has hubs).
  const countryEntries: MetadataRoute.Sitemap = Array.from(
    new Map(hubs.map((h) => [h.country.code, h.country])).values(),
  ).map((c) => ({
    url: `${SITE.url}/${c.code}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Hubs — only those that pass the thin-content (indexable) rule.
  const hubEntries: MetadataRoute.Sitemap = [];
  const calculators = new Set<string>();
  for (const { country: c, family: f } of hubs) {
    calculators.add(calculatorFor(f));
    const hub = await getHub(c.code, f.type);
    const products = await getHubProducts(c.code, f.type);
    if (!hubIsIndexable(hub, products.length)) continue;
    // Real edit time, not now() — accurate dates feed the freshness/momentum
    // signal. Fall back to the freshest product if the hub somehow has no stamp.
    const freshestProduct = products.reduce<Date | null>(
      (max, p) => (!max || p.lastVerifiedAt > max ? p.lastVerifiedAt : max),
      null,
    );
    hubEntries.push({
      url: `${SITE.url}/${c.code}/${f.slug}`,
      lastModified: hub?.updatedAt ?? freshestProduct ?? now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // Calculators that are in use.
  const calcEntries: MetadataRoute.Sitemap = [...calculators].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Use-case landing pages (indexable ones only).
  const { USE_CASES } = await import("@/lib/usecases");
  const useCaseEntries: MetadataRoute.Sitemap = [];
  for (const uc of USE_CASES) {
    const all = await getHubProducts(uc.country, uc.productType);
    const count = all.filter(uc.predicate).length;
    if (!hubIsIndexable({ intro: uc.intro }, count)) continue;
    useCaseEntries.push({
      url: `${SITE.url}/best/${uc.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Products (live only).
  const products = await prisma.product.findMany({
    where: { live: true },
    select: { slug: true, lastVerifiedAt: true },
  });
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/product/${p.slug}`,
    lastModified: p.lastVerifiedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...countryEntries,
    ...hubEntries,
    ...calcEntries,
    ...useCaseEntries,
    ...productEntries,
  ];
}
