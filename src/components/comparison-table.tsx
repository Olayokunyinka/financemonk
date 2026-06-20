"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { ProductRow } from "@/lib/rows";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

type SortKey = "rating" | "apr" | "fees" | "amount";

// F1 comparison hub table. Sortable + filterable. Each row carries the
// mandatory last-verified date and an Apply CTA (the CPA hook). Sponsored rows
// are clearly labelled.
export function ComparisonTable({ rows }: { rows: ProductRow[] }) {
  const [sort, setSort] = useState<SortKey>("rating");
  const [providerType, setProviderType] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const providerTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.providerType))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      if (providerType !== "all" && r.providerType !== providerType)
        return false;
      if (verifiedOnly && r.badgeTier !== "gold") return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      // Sponsored rows always float to the top (labelled), then the sort key.
      if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
      switch (sort) {
        case "apr":
          return a.aprSort - b.aprSort;
        case "fees":
          return a.feesSort - b.feesSort;
        case "amount":
          return a.minAmountSort - b.minAmountSort;
        case "rating":
        default:
          return b.rating - a.rating;
      }
    });
    return out;
  }, [rows, sort, providerType, verifiedOnly]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border bg-background px-2 py-1.5"
          >
            <option value="rating">Top rated</option>
            <option value="apr">Lowest interest</option>
            <option value="fees">Lowest fees</option>
            <option value="amount">Lowest min. amount</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Provider</span>
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5"
          >
            <option value="all">All types</option>
            {providerTypes.map((t) => (
              <option key={t} value={t}>
                {prettyType(t)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
          <span>Verified providers only</span>
        </label>

        <span className="ml-auto text-muted-foreground">
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Provider &amp; product</th>
              <th className="px-4 py-3 font-medium">Interest (p.a.)</th>
              <th className="px-4 py-3 font-medium">Fees</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.slug} className="align-top hover:bg-muted/30">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${r.slug}`}
                      className="font-medium hover:text-brand"
                    >
                      {r.providerName}
                    </Link>
                    <RowBadge tier={r.badgeTier} basis={r.badgeBasis} label={r.badgeLabel} />
                    {r.sponsored ? (
                      <Badge variant="sponsored" title="Paid placement">
                        Sponsored
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground">{r.name}</div>
                  {r.keyFeature ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.keyFeature}
                    </div>
                  ) : null}
                  <div className="mt-1">
                    <LastVerified date={r.lastVerifiedISO} />
                  </div>
                </td>
                <td className="px-4 py-4 font-medium">{r.aprText}</td>
                <td className="px-4 py-4">{r.feesText}</td>
                <td className="px-4 py-4">{r.amountText}</td>
                <td className="px-4 py-4">
                  <RatingStars value={r.rating} count={r.reviewCount} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <ButtonLink href={`/apply/${r.slug}`} size="sm" variant="accent">
                      Apply
                    </ButtonLink>
                    <ButtonLink href={`/product/${r.slug}`} size="sm" variant="outline">
                      View
                    </ButtonLink>
                    <CompareToggle slug={r.slug} name={r.providerName} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((r) => (
          <div key={r.slug} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Link href={`/product/${r.slug}`} className="font-medium">
                {r.providerName}
              </Link>
              <RowBadge tier={r.badgeTier} basis={r.badgeBasis} label={r.badgeLabel} />
              {r.sponsored ? <Badge variant="sponsored">Sponsored</Badge> : null}
            </div>
            <div className="text-sm text-muted-foreground">{r.name}</div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Interest p.a.</dt>
                <dd className="font-medium">{r.aprText}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Fees</dt>
                <dd>{r.feesText}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd>{r.amountText}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Rating</dt>
                <dd>
                  <RatingStars value={r.rating} count={r.reviewCount} />
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <LastVerified date={r.lastVerifiedISO} />
            </div>
            <div className="mt-3 flex gap-2">
              <ButtonLink href={`/apply/${r.slug}`} size="sm" variant="accent" className="flex-1">
                Apply
              </ButtonLink>
              <ButtonLink href={`/product/${r.slug}`} size="sm" variant="outline" className="flex-1">
                View
              </ButtonLink>
            </div>
            <div className="mt-2">
              <CompareToggle slug={r.slug} name={r.providerName} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowBadge({
  tier,
  label,
  basis,
}: {
  tier: "gold" | "grey" | "none";
  label: string;
  basis: string;
}) {
  if (tier === "gold")
    return (
      <Badge variant="gold" title={basis}>
        <BadgeCheck className="h-3.5 w-3.5" /> {label}
      </Badge>
    );
  if (tier === "grey")
    return (
      <Badge variant="neutral" title={basis}>
        <ShieldCheck className="h-3.5 w-3.5" /> {label}
      </Badge>
    );
  return null;
}

function prettyType(t: string): string {
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
