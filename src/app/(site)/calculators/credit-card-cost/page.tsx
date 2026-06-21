import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@/generated/prisma/enums";
import { toRow } from "@/lib/rows";
import { SITE } from "@/lib/site";
import { CreditCardCalculator } from "@/components/credit-card-calculator";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

export const metadata: Metadata = {
  title: "Credit card cost calculator",
  description:
    "See how long a credit-card balance takes to clear and the total interest, then compare lower-rate cards.",
  alternates: { canonical: "/calculators/credit-card-cost" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function num(v: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function CreditCardCostPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const balance = num(sp.balance, 100000);
  const apr = num(sp.apr, 30);
  const payment = num(sp.payment, 20000);

  const products = await prisma.product.findMany({
    where: { productType: ProductType.CREDIT_CARD, live: true },
    include: { provider: true },
    orderBy: [{ sponsored: "desc" }, { aprMin: "asc" }],
    take: 6,
  });
  const rows = products.map(toRow);

  const toolLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Credit card cost calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: `${SITE.url}/calculators/credit-card-cost`,
    offers: { "@type": "Offer", price: 0, priceCurrency: "NGN" },
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={toolLd} />
      <h1 className="text-3xl font-bold tracking-tight">
        Credit card cost calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        See how long a balance takes to clear and what the interest adds up to,
        then compare lower-rate cards in Nigeria.
      </p>

      <div className="mt-6">
        <CreditCardCalculator defaults={{ balance, apr, payment }} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Lower-rate credit cards</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cards with the lowest purchase APR first.
        </p>
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.slug} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/product/${r.slug}`} className="font-medium hover:text-brand">
                  {r.providerName}
                </Link>
                {r.badgeTier === "gold" ? (
                  <Badge variant="gold" title={r.badgeBasis}>{r.badgeLabel}</Badge>
                ) : r.badgeTier === "grey" ? (
                  <Badge variant="neutral" title={r.badgeBasis}>{r.badgeLabel}</Badge>
                ) : null}
                {r.sponsored ? <Badge variant="sponsored">Sponsored</Badge> : null}
                <span className="ml-auto">
                  <RatingStars value={r.rating} count={r.reviewCount} />
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{r.name}</div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>
                  <span className="text-xs text-muted-foreground">Purchase APR </span>
                  <span className="font-medium">{r.aprText}</span>
                </span>
                <span>
                  <span className="text-xs text-muted-foreground">Fees </span>
                  {r.feesText}
                </span>
              </dl>
              <div className="mt-3 flex items-center gap-2">
                <ButtonLink href={`/apply/${r.slug}`} size="sm" variant="accent">
                  Apply
                </ButtonLink>
                <ButtonLink href={`/product/${r.slug}`} size="sm" variant="outline">
                  View
                </ButtonLink>
                <CompareToggle slug={r.slug} name={r.providerName} />
                <span className="ml-auto">
                  <LastVerified date={r.lastVerifiedISO} />
                </span>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="rounded-xl border border-border p-6 text-muted-foreground">
              No credit cards yet.{" "}
              <Link href="/" className="text-brand hover:underline">Browse all</Link>.
            </p>
          ) : null}
        </div>
        <Disclaimer className="mt-4" />
      </section>
    </div>
  );
}
