import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toRow } from "@/lib/rows";
import type { ProductType } from "@/generated/prisma/enums";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

// Shared "matching products" list used by the family calculators. Renders the
// family-generic metrics from each row.
export async function FamilyResults({
  country,
  productTypes,
  heading,
  emptyHref = "/",
}: {
  country: string;
  productTypes: ProductType[];
  heading: string;
  emptyHref?: string;
}) {
  const products = await prisma.product.findMany({
    where: { country, productType: { in: productTypes }, live: true },
    include: { provider: true },
    orderBy: [{ sponsored: "desc" }, { ratingAggregate: "desc" }],
    take: 6,
  });
  const rows = products.map(toRow);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{heading}</h2>
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
              {r.metrics.slice(0, 3).map((m) => (
                <span key={m.label}>
                  <span className="text-xs text-muted-foreground">{m.label} </span>
                  <span className="font-medium">{m.value}</span>
                </span>
              ))}
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
            No matching products yet.{" "}
            <Link href={emptyHref} className="text-brand hover:underline">
              Browse all
            </Link>
            .
          </p>
        ) : null}
      </div>
      <Disclaimer className="mt-4" />
    </section>
  );
}
