import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/search";
import { ProductType } from "@/generated/prisma/enums";
import { toRow } from "@/lib/rows";
import { SITE } from "@/lib/site";
import { LoanCalculator } from "@/components/loan-calculator";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

export const metadata: Metadata = {
  title: "Loan repayment calculator (Nigeria)",
  description:
    "Work out the monthly repayment and total cost of a personal loan in Nigeria, then compare matching products by interest rate.",
  alternates: { canonical: "/calculators/loan-repayment" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function num(
  v: string | string[] | undefined,
  fallback: number,
): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function LoanCalculatorPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const amount = num(sp.amount, 500000);
  const rate = num(sp.rate, 24);
  const tenure = num(sp.tenure, 12);

  // Matching products: personal loans that can cover this amount over this
  // tenure, cheapest interest first.
  const products = await searchProducts({
    productType: ProductType.PERSONAL_LOAN,
    amount,
    tenure,
    sort: "apr",
  });
  const rows = products.slice(0, 6).map(toRow);

  const toolLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Loan repayment calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: `${SITE.url}/calculators/loan-repayment`,
    offers: { "@type": "Offer", price: 0, priceCurrency: "NGN" },
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={toolLd} />

      <h1 className="text-3xl font-bold tracking-tight">
        Loan repayment calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Estimate your monthly repayment and the total cost of a personal loan,
        then jump straight to matching products in Nigeria.
      </p>

      <div className="mt-6">
        <LoanCalculator defaults={{ amount, rate, tenure }} />
      </div>

      {/* Matching products funnel */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Matching products for {formatNaira(amount)} over {tenure} months
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal loans that can cover this amount and tenure, lowest interest
          first.
        </p>

        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.slug} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/product/${r.slug}`}
                  className="font-medium hover:text-brand"
                >
                  {r.providerName}
                </Link>
                {r.badgeTier === "gold" ? (
                  <Badge variant="gold" title={r.badgeBasis}>
                    {r.badgeLabel}
                  </Badge>
                ) : r.badgeTier === "grey" ? (
                  <Badge variant="neutral" title={r.badgeBasis}>
                    {r.badgeLabel}
                  </Badge>
                ) : null}
                {r.sponsored ? <Badge variant="sponsored">Sponsored</Badge> : null}
                <span className="ml-auto">
                  <RatingStars value={r.rating} count={r.reviewCount} />
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{r.name}</div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>
                  <span className="text-xs text-muted-foreground">
                    Interest p.a.{" "}
                  </span>
                  <span className="font-medium">{r.aprText}</span>
                </span>
                <span>
                  <span className="text-xs text-muted-foreground">Fees </span>
                  {r.feesText}
                </span>
                <span>
                  <span className="text-xs text-muted-foreground">Amount </span>
                  {r.amountText}
                </span>
              </dl>
              <div className="mt-3 flex items-center gap-2">
                <ButtonLink
                  href={`/product/${r.slug}#apply`}
                  size="sm"
                  variant="accent"
                >
                  Apply
                </ButtonLink>
                <ButtonLink
                  href={`/product/${r.slug}`}
                  size="sm"
                  variant="outline"
                >
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
              No personal loans currently match that amount and tenure. Try a
              different amount, or{" "}
              <Link href="/ng/personal-loans" className="text-brand hover:underline">
                browse all personal loans
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

function formatNaira(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}
