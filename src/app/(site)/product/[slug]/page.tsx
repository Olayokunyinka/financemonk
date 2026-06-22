import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getProductBySlug,
  getAlternatives,
  getPublishedReviews,
} from "@/lib/queries";
import { familyByType, getCountry, COUNTRIES } from "@/lib/taxonomy";
import { isCpaEnabled } from "@/lib/site";
import {
  productJsonLd,
  reviewsJsonLd,
  breadcrumbJsonLd,
} from "@/lib/jsonld";
import {
  formatApr,
  formatCurrency,
  formatPercent,
} from "@/lib/format";
import { representativeExample } from "@/lib/loan";
import { representativeSavingsExample } from "@/lib/savings";
import { buildMetrics } from "@/lib/families/registry";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Disclaimer, LastVerified } from "@/components/disclaimer";
import { VerifiedBadge } from "@/components/verified-badge";
import { ByLine } from "@/components/byline";
import { RatingStars } from "@/components/rating-stars";
import { ProductCard } from "@/components/product-card";
import { ReportReview } from "@/components/report-review";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600; // ISR

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — review, rates & terms`,
    description:
      product.summary ??
      `Terms, fees, eligibility and reviews for ${product.name}.`,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage(props: { params: Params }) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const family = familyByType(product.productType);
  const country = getCountry(product.country) ?? COUNTRIES.ng;
  const reviews = await getPublishedReviews(product.id);
  const alternatives = family
    ? await getAlternatives(product.country, product.productType, product.slug, 4)
    : [];

  const kind = family?.kind ?? "loan";
  const lending = kind === "loan";
  const CPA_ENABLED = isCpaEnabled(product.country);
  // Comparable terms for this family, from the registry (drives the Terms table).
  const termMetrics = buildMetrics(kind, {
    aprMin: product.aprMin,
    aprMax: product.aprMax,
    interestRate: product.interestRate,
    fees: product.fees,
    minAmount: product.minAmount,
    maxAmount: product.maxAmount,
    minTenureMonths: product.minTenureMonths,
    maxTenureMonths: product.maxTenureMonths,
    currency: product.currency,
    terms: product.terms,
  });
  const sources =
    (product.sourceRefs as { label: string; url: string }[]) ?? [];
  const example = representativeExample(product);
  const savingsExample = representativeSavingsExample(product);
  // Card cost illustration: interest on a carried balance for one month.
  const cardApr = product.aprMin ?? product.aprMax ?? 0;
  const cardBalance = Math.min(100000, product.maxAmount ?? 100000);
  const cardMonthlyInterest = (cardBalance * cardApr) / 100 / 12;

  const hubHref = family ? `/${country.code}/${family.slug}` : "/";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: country.name, href: `/${country.code}` },
    { name: family?.labelTitle ?? "Products", href: hubHref },
    { name: product.name, href: `/product/${product.slug}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          productJsonLd(product, {
            kind,
            country,
          }),
          reviewsJsonLd(product, reviews),
        ]}
      />

      <Breadcrumbs crumbs={crumbs} />

      {/* Header */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={hubHref} className="hover:text-brand">
              {product.provider.name}
            </Link>
            {product.sponsored ? (
              <Badge variant="sponsored" title="Paid placement">
                Sponsored
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <VerifiedBadge
              input={{
                verificationBadge: product.verificationBadge,
                licensed: product.provider.licensed,
                claimed: product.provider.claimed,
                licenseSource: product.provider.licenseSource,
              }}
              showUnverified
            />
            <RatingStars
              value={product.ratingAggregate}
              count={product.reviewCount}
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-2">
          <ButtonLink href="#apply" size="lg" variant="accent">
            Apply / Get this product
          </ButtonLink>
          <Link
            href="/claim"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Claim this listing
          </Link>
        </div>
      </div>

      <ByLine className="mt-4" lastVerifiedAt={product.lastVerifiedAt} />

      {product.summary ? (
        <p className="mt-4 max-w-3xl text-muted-foreground">{product.summary}</p>
      ) : null}

      {/* Licence line (E-E-A-T trust signal) */}
      {product.provider.licensed ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-bg/50 px-3 py-2 text-sm text-gold">
          <CheckCircle2 className="h-4 w-4" />
          Provider licensed — {product.provider.licenseSource}
          {product.provider.licenseRef
            ? ` (${product.provider.licenseRef})`
            : ""}
        </p>
      ) : (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          We have not matched this provider to the {country.regulator} licence
          register. It cannot show the gold Verified badge.
        </p>
      )}

      {/* Terms table */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Terms</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {termMetrics.map((m) => (
                <Row key={m.label} label={m.label}>
                  {m.value}
                </Row>
              ))}
              <Row label="Eligibility">
                {product.eligibility.length ? (
                  <ul className="list-disc pl-4">
                    {product.eligibility.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Required documents">
                {product.requiredDocs.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {product.requiredDocs.map((d) => (
                      <li
                        key={d}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        {d}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </Row>
            </tbody>
          </table>
        </div>
        <Disclaimer className="mt-3" lastVerifiedAt={product.lastVerifiedAt} />
      </section>

      {/* Total-cost / growth illustration (loan/deposit/card only) */}
      {kind === "card" || kind === "loan" || kind === "deposit" ? (
      <section className="mt-8 rounded-xl border border-border bg-muted/30 p-5">
        {kind === "card" ? (
          <>
            <h2 className="text-lg font-semibold">What a balance costs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Representative example (interest on a carried balance — pay in full
              within the interest-free period to avoid it):
            </p>
            <p className="mt-3 text-sm">
              Carry{" "}
              <strong>{formatCurrency(cardBalance, product.currency)}</strong>{" "}
              for a month at{" "}
              <strong>{formatApr(product.aprMin, product.aprMax)}</strong> →
              about{" "}
              <strong>
                {formatCurrency(cardMonthlyInterest, product.currency)}
              </strong>{" "}
              in interest that month.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative only — actual charges depend on the card&apos;s terms,
              fees and how you repay.{" "}
              <Link
                href="/calculators/credit-card-cost"
                className="text-brand hover:underline"
              >
                Try the calculator
              </Link>
              .
            </p>
          </>
        ) : lending ? (
          <>
            <h2 className="text-lg font-semibold">What you&apos;d actually pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Representative example (reducing-balance, interest only — excludes
              fees):
            </p>
            <p className="mt-3 text-sm">
              Borrow{" "}
              <strong>
                {formatCurrency(example.principal, product.currency)}
              </strong>{" "}
              over <strong>{example.months} months</strong> at{" "}
              <strong>{formatApr(product.aprMin, product.aprMax)}</strong> →
              about{" "}
              <strong>
                {formatCurrency(example.monthly, product.currency)}
              </strong>{" "}
              per month, total repayment about{" "}
              <strong>{formatCurrency(example.total, product.currency)}</strong>{" "}
              (≈ {formatCurrency(example.interest, product.currency)} interest).
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative only — your actual rate, fees and repayments depend on
              the provider&apos;s assessment.{" "}
              <Link href="/calculators/loan-repayment" className="text-brand hover:underline">
                Try the calculator
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">What you&apos;d earn</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Representative example (compound interest, before tax):
            </p>
            <p className="mt-3 text-sm">
              Save{" "}
              <strong>
                {formatCurrency(savingsExample.principal, product.currency)}
              </strong>{" "}
              for <strong>{savingsExample.years} year</strong> at{" "}
              <strong>{formatPercent(product.interestRate)}</strong> → about{" "}
              <strong>
                {formatCurrency(savingsExample.futureValue, product.currency)}
              </strong>{" "}
              (≈ {formatCurrency(savingsExample.interest, product.currency)}{" "}
              interest earned).
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative only — actual returns depend on tiers, tax and the
              provider&apos;s terms.{" "}
              <Link
                href={`/calculators/savings-growth?country=${country.code}`}
                className="text-brand hover:underline"
              >
                Try the calculator
              </Link>
              .
            </p>
          </>
        )}
      </section>
      ) : null}

      {/* Apply / CPA */}
      <section
        id="apply"
        className="mt-8 rounded-xl border border-accent/40 bg-accent/5 p-5"
      >
        <h2 className="text-lg font-semibold">Apply for {product.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {CPA_ENABLED
            ? "Answer a few quick questions and we'll hand your application to the provider."
            : "Start an enquiry. Guided referral isn't enabled for this country yet, so you'll be directed to the provider's own site."}
        </p>
        <ButtonLink
          href={`/apply/${product.slug}`}
          className="mt-3"
          variant="accent"
        >
          {CPA_ENABLED ? "Start application" : "Start enquiry"}
        </ButtonLink>
      </section>

      {/* Reviews */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <ButtonLink
            href={`/product/${product.slug}/review`}
            size="sm"
            variant="outline"
          >
            Write a review
          </ButtonLink>
        </div>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No published reviews yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <RatingStars value={r.overall} />
                  {r.reviewerType === "VERIFIED_CUSTOMER" ? (
                    <Badge variant="brand">Verified customer</Badge>
                  ) : (
                    <Badge variant="neutral">Customer</Badge>
                  )}
                </div>
                <div className="mt-2 font-medium">{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {r.authorName ?? "Anonymous"}
                  </span>
                  <ReportReview reviewId={r.id} />
                </div>
                {r.ownerResponse ? (
                  <div className="mt-3 rounded-lg border-l-2 border-brand bg-muted/50 p-3 text-sm">
                    <div className="font-medium text-brand">
                      Response from {product.provider.name}
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {r.ownerResponse}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Alternatives (mandatory) */}
      {alternatives.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Alternatives</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Other {family?.label} in {country.name}, ranked by rating.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {alternatives.map((a) => (
              <ProductCard key={a.slug} product={a} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Sources + freshness */}
      <section className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <LastVerified date={product.lastVerifiedAt} />
          {sources.length > 0 ? (
            <span>
              Source:{" "}
              {sources.map((s, i) => (
                <span key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="nofollow noopener"
                    className="text-brand hover:underline"
                  >
                    {s.label}
                  </a>
                  {i < sources.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          ) : null}
        </div>
        <p className="mt-3">
          Indicative only — confirm exact terms with the provider before
          applying. See our{" "}
          <Link href="/methodology" className="text-brand hover:underline">
            methodology
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="align-top">
      <th className="w-48 bg-muted/40 px-4 py-3 text-left font-medium">
        {label}
      </th>
      <td className="px-4 py-3">{children}</td>
    </tr>
  );
}
