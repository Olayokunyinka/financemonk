// Schema.org structured-data builders (JSON-LD).
//
// Emitted on directory/SEO pages so Google can render rich results and
// understand the YMYL content. Covers FinancialProduct / LoanOrCredit, Review,
// AggregateRating, FAQPage, ItemList and BreadcrumbList.

import { SITE } from "@/lib/site";
import type { Country, Family } from "@/lib/taxonomy";

type AnyProduct = {
  slug: string;
  name: string;
  summary: string | null;
  aprMin: number | null;
  aprMax: number | null;
  interestRate: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  currency: string;
  minTenureMonths: number | null;
  maxTenureMonths: number | null;
  ratingAggregate: number;
  reviewCount: number;
  provider: { name: string; website: string | null };
};

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

// FinancialProduct / LoanOrCredit for a single product. Lending families use
// the more specific LoanOrCredit type (which supports annualPercentageRate and
// amount); deposit families fall back to FinancialProduct.
export function productJsonLd(
  product: AnyProduct,
  opts: { kind: "loan" | "deposit" | "card"; country: Country },
) {
  const apr = product.aprMin ?? product.aprMax ?? null;
  const credit = opts.kind === "loan" || opts.kind === "card";
  const schemaType =
    opts.kind === "card"
      ? "CreditCard"
      : opts.kind === "loan"
        ? "LoanOrCredit"
        : "FinancialProduct";

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": absoluteUrl(`/product/${product.slug}`),
    name: product.name,
    url: absoluteUrl(`/product/${product.slug}`),
    description: product.summary ?? product.name,
    category:
      opts.kind === "card"
        ? "Credit card"
        : opts.kind === "loan"
          ? "Loan"
          : "Financial product",
    areaServed: { "@type": "Country", name: opts.country.name },
    provider: {
      "@type": "BankOrCreditUnion",
      name: product.provider.name,
      ...(product.provider.website ? { url: product.provider.website } : {}),
    },
  };

  if (credit) {
    if (apr != null) base.annualPercentageRate = apr;
    if (product.maxAmount != null || product.minAmount != null) {
      base.amount = {
        "@type": "MonetaryAmount",
        currency: product.currency,
        ...(product.minAmount != null ? { minValue: product.minAmount } : {}),
        ...(product.maxAmount != null ? { maxValue: product.maxAmount } : {}),
      };
    }
    if (product.maxTenureMonths != null) {
      base.loanTerm = {
        "@type": "QuantitativeValue",
        unitCode: "MON",
        ...(product.minTenureMonths != null
          ? { minValue: product.minTenureMonths }
          : {}),
        maxValue: product.maxTenureMonths,
      };
    }
  } else if (product.interestRate != null) {
    base.interestRate = product.interestRate;
  }

  if (product.reviewCount > 0 && product.ratingAggregate > 0) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.ratingAggregate.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return base;
}

export type ReviewLd = {
  title: string;
  body: string;
  overall: number;
  authorName: string | null;
  createdAt: Date | string;
};

export function reviewsJsonLd(product: AnyProduct, reviews: ReviewLd[]) {
  if (reviews.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    review: reviews.map((r) => ({
      "@type": "Review",
      name: r.title,
      reviewBody: r.body,
      datePublished: new Date(r.createdAt).toISOString(),
      author: { "@type": "Person", name: r.authorName ?? "Verified user" },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.overall,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };
}

export type FaqItem = { question: string; answer: string };

export function faqJsonLd(faq: FaqItem[]) {
  if (!faq || faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function hubItemListJsonLd(
  products: { slug: string; name: string }[],
  hubTitle: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hubTitle,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug}`),
      name: p.name,
    })),
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; href: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  };
}

export function organisationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function hubTitleFor(country: Country, family: Family, year = 2026) {
  return `Best ${family.label} in ${country.name} (${year})`;
}
