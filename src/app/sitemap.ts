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

  // Hubs — only those that pass the thin-content (indexable) rule.
  const hubEntries: MetadataRoute.Sitemap = [];
  const calculators = new Set<string>();
  for (const { country: c, family: f } of await listHubs()) {
    calculators.add(calculatorFor(f));
    const hub = await getHub(c.code, f.type);
    const products = await getHubProducts(c.code, f.type);
    if (!hubIsIndexable(hub, products.length)) continue;
    hubEntries.push({
      url: `${SITE.url}/${c.code}/${f.slug}`,
      lastModified: now,
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

  return [...staticEntries, ...hubEntries, ...calcEntries, ...productEntries];
}
