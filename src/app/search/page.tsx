import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { ProviderType } from "@/generated/prisma/enums";
import { searchProducts, getFacetOptions, type SortKey } from "@/lib/search";
import { toRow } from "@/lib/rows";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified, Disclaimer } from "@/components/disclaimer";
import { CompareToggle } from "@/components/compare/compare-tray";

export const metadata: Metadata = {
  title: "Search financial products",
  description:
    "Search and filter personal loans by interest rate, fees, amount, tenure, provider type and use-case.",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

const PROVIDER_TYPES = Object.values(ProviderType);

function prettyType(t: string): string {
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function SearchPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;

  const providerTypeRaw = str(sp.provider);
  const providerType = PROVIDER_TYPES.includes(providerTypeRaw as ProviderType)
    ? (providerTypeRaw as ProviderType)
    : undefined;

  const filters = {
    q: str(sp.q),
    providerType,
    amount: num(sp.amount),
    tenure: num(sp.tenure),
    maxApr: num(sp.maxApr),
    useCase: str(sp.useCase),
    noFees: str(sp.noFees) === "1",
    sort: (str(sp.sort) as SortKey) ?? undefined,
  };

  const [products, facets] = await Promise.all([
    searchProducts(filters),
    getFacetOptions(),
  ]);
  const rows = products.map(toRow);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Search personal loans</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-[260px_1fr]">
        {/* Filters (GET form — works without JS, crawlable) */}
        <aside>
          <form method="GET" action="/search" className="space-y-4 text-sm">
            <div>
              <label className="mb-1 block font-medium">Keyword</label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={filters.q ?? ""}
                  placeholder="e.g. salary, instant"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-2"
                />
              </div>
            </div>

            <Field label="Provider type">
              <select
                name="provider"
                defaultValue={filters.providerType ?? ""}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              >
                <option value="">All types</option>
                {facets.providerTypes.map((t) => (
                  <option key={t} value={t}>
                    {prettyType(t)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount you want (₦)">
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                defaultValue={filters.amount ?? ""}
                placeholder="e.g. 500000"
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </Field>

            <Field label="Tenure (months)">
              <input
                name="tenure"
                type="number"
                inputMode="numeric"
                defaultValue={filters.tenure ?? ""}
                placeholder="e.g. 12"
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </Field>

            <Field label="Max interest p.a. (%)">
              <input
                name="maxApr"
                type="number"
                inputMode="numeric"
                defaultValue={filters.maxApr ?? ""}
                placeholder="e.g. 30"
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </Field>

            <Field label="Use-case">
              <select
                name="useCase"
                defaultValue={filters.useCase ?? ""}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              >
                <option value="">Any</option>
                {facets.useCases.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="noFees"
                value="1"
                defaultChecked={filters.noFees}
              />
              No fees only
            </label>

            <Field label="Sort by">
              <select
                name="sort"
                defaultValue={filters.sort ?? ""}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              >
                <option value="">{filters.q ? "Relevance" : "Top rated"}</option>
                <option value="rating">Top rated</option>
                <option value="apr">Lowest interest</option>
                <option value="fees">Lowest fees</option>
                <option value="amount">Lowest min. amount</option>
              </select>
            </Field>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-10 flex-1 rounded-lg bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90"
              >
                Apply
              </button>
              <Link
                href="/search"
                className="flex h-10 items-center rounded-lg border border-border px-4"
              >
                Reset
              </Link>
            </div>
          </form>
        </aside>

        {/* Results */}
        <section>
          <p className="text-sm text-muted-foreground">
            {rows.length} result{rows.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 space-y-3">
            {rows.map((r) => (
              <div
                key={r.slug}
                className="rounded-xl border border-border p-4"
              >
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
                  {r.sponsored ? (
                    <Badge variant="sponsored">Sponsored</Badge>
                  ) : null}
                  <span className="ml-auto">
                    <RatingStars value={r.rating} count={r.reviewCount} />
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{r.name}</div>
                {r.summary ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.summary}
                  </p>
                ) : null}
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <Stat label="Interest p.a." value={r.aprText} />
                  <Stat label="Fees" value={r.feesText} />
                  <Stat label="Amount" value={r.amountText} />
                  <Stat label="Tenure" value={r.tenureText} />
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
                No products match these filters.{" "}
                <Link href="/search" className="text-brand hover:underline">
                  Reset
                </Link>
                .
              </p>
            ) : null}
          </div>
          <Disclaimer className="mt-4" />
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-medium">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
