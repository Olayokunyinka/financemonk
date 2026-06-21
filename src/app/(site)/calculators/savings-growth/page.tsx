import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@/generated/prisma/enums";
import { getCountry, currencyOf, COUNTRIES } from "@/lib/taxonomy";
import { toRow } from "@/lib/rows";
import { SITE } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { SavingsCalculator } from "@/components/savings-calculator";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

export const metadata: Metadata = {
  title: "Savings growth calculator",
  description:
    "Work out how much your savings could grow, then compare the highest-interest savings accounts.",
  alternates: { canonical: "/calculators/savings-growth" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function num(v: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

export default async function SavingsCalculatorPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const countryCode = str(sp.country) ?? "ng";
  const country = getCountry(countryCode) ?? COUNTRIES.ng;
  const currency = currencyOf(country.code);

  const deposit = num(sp.deposit, 100000);
  const rate = num(sp.rate, 10);
  const years = num(sp.years, 3);
  const monthly = num(sp.monthly, 0);

  // Matching savings products in this country that accept this opening balance,
  // highest interest first.
  const products = await prisma.product.findMany({
    where: {
      country: country.code,
      productType: ProductType.SAVINGS,
      live: true,
      OR: [{ minAmount: null }, { minAmount: { lte: deposit } }],
    },
    include: { provider: true },
    orderBy: [{ sponsored: "desc" }, { interestRate: "desc" }],
    take: 6,
  });
  const rows = products.map(toRow);

  const toolLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Savings growth calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: `${SITE.url}/calculators/savings-growth`,
    offers: { "@type": "Offer", price: 0, priceCurrency: currency },
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={toolLd} />

      <h1 className="text-3xl font-bold tracking-tight">
        Savings growth calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        See how your savings could grow with compound interest, then compare the
        highest-interest savings accounts in {country.name}.
      </p>

      <div className="mt-6">
        <SavingsCalculator
          defaults={{ deposit, rate, years, monthly }}
          currency={currency}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Top savings accounts in {country.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accounts that accept a {formatCurrency(deposit, currency)} opening
          balance, highest interest first.
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
                  <span className="text-xs text-muted-foreground">Interest p.a. </span>
                  <span className="font-medium">{r.aprText}</span>
                </span>
                <span>
                  <span className="text-xs text-muted-foreground">Fees </span>
                  {r.feesText}
                </span>
                <span>
                  <span className="text-xs text-muted-foreground">Min balance </span>
                  {r.amountText}
                </span>
              </dl>
              <div className="mt-3 flex items-center gap-2">
                <ButtonLink href={`/apply/${r.slug}`} size="sm" variant="accent">
                  Open account
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
              No savings accounts match yet.{" "}
              <Link href="/" className="text-brand hover:underline">
                Browse all
              </Link>
              .
            </p>
          ) : null}
        </div>
        <Disclaimer className="mt-4" />
      </section>
    </div>
  );
}
