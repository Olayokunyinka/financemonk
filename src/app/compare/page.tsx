import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toRow } from "@/lib/rows";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Compare products side by side",
  robots: { index: false, follow: true }, // transactional view, no SEO value
};

type SearchParams = Promise<{ ids?: string }>;

export default async function ComparePage(props: {
  searchParams: SearchParams;
}) {
  const { ids } = await props.searchParams;
  const slugs = (ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (slugs.length === 0) {
    return (
      <ComingSoon title="Nothing to compare yet" milestone="the compare tray">
        Add 2–4 products to the compare tray from a comparison hub or search
        results, then open this page.
      </ComingSoon>
    );
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, live: true },
    include: { provider: true },
  });
  // Preserve the order the user picked.
  const ordered = slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is (typeof products)[number] => !!p);
  const rows = ordered.map(toRow);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Compare products</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} product{rows.length === 1 ? "" : "s"} side by side.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-40 p-3 text-left align-bottom" />
              {rows.map((r) => (
                <th key={r.slug} className="border-l border-border p-3 text-left align-bottom">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.providerName}</span>
                    {r.badgeTier === "gold" ? (
                      <Badge variant="gold" title={r.badgeBasis}>
                        <BadgeCheck className="h-3.5 w-3.5" /> {r.badgeLabel}
                      </Badge>
                    ) : r.badgeTier === "grey" ? (
                      <Badge variant="neutral" title={r.badgeBasis}>
                        <ShieldCheck className="h-3.5 w-3.5" /> {r.badgeLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <Link
                    href={`/product/${r.slug}`}
                    className="mt-1 block font-normal text-muted-foreground hover:text-brand"
                  >
                    {r.name}
                  </Link>
                  {r.sponsored ? (
                    <Badge variant="sponsored" className="mt-1">
                      Sponsored
                    </Badge>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <CompareRow label="Rating">
              {rows.map((r) => (
                <Cell key={r.slug}>
                  <RatingStars value={r.rating} count={r.reviewCount} />
                </Cell>
              ))}
            </CompareRow>
            <CompareRow label="Interest (p.a.)">
              {rows.map((r) => (
                <Cell key={r.slug} className="font-medium">
                  {r.aprText}
                </Cell>
              ))}
            </CompareRow>
            <CompareRow label="Fees">
              {rows.map((r) => (
                <Cell key={r.slug}>{r.feesText}</Cell>
              ))}
            </CompareRow>
            <CompareRow label="Amount">
              {rows.map((r) => (
                <Cell key={r.slug}>{r.amountText}</Cell>
              ))}
            </CompareRow>
            <CompareRow label="Tenure">
              {rows.map((r) => (
                <Cell key={r.slug}>{r.tenureText}</Cell>
              ))}
            </CompareRow>
            <CompareRow label="Key feature">
              {rows.map((r) => (
                <Cell key={r.slug}>{r.keyFeature || "—"}</Cell>
              ))}
            </CompareRow>
            <CompareRow label="Verified">
              {rows.map((r) => (
                <Cell key={r.slug}>
                  {r.badgeTier === "gold" ? "Yes (licensed + claimed)" : "No"}
                </Cell>
              ))}
            </CompareRow>
            <CompareRow label="Last verified">
              {rows.map((r) => (
                <Cell key={r.slug}>
                  <LastVerified date={r.lastVerifiedISO} />
                </Cell>
              ))}
            </CompareRow>
            <CompareRow label="">
              {rows.map((r) => (
                <Cell key={r.slug}>
                  <ButtonLink
                    href={`/product/${r.slug}#apply`}
                    size="sm"
                    variant="accent"
                  >
                    Apply
                  </ButtonLink>
                </Cell>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>

      <Disclaimer className="mt-4" />

      <p className="mt-6 text-sm">
        <Link href="/ng/personal-loans" className="text-brand hover:underline">
          ← Back to all personal loans
        </Link>
      </p>
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th className="bg-muted/40 p-3 text-left align-top font-medium">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-l border-border p-3 align-top ${className}`}>
      {children}
    </td>
  );
}
