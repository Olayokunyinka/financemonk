import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Browsing is fully open to crawlers (critical for SEO). We only disallow the
// authenticated/transactional surfaces that have no SEO value.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/apply", "/api"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
