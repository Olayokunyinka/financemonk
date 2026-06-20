import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  freshnessOf,
  STALE_AFTER_DAYS,
  AGING_AFTER_DAYS,
} from "@/lib/freshness";
import { Badge } from "@/components/ui/badge";
import { markProductVerified } from "./actions";

export const metadata: Metadata = {
  title: "Rate freshness",
  robots: { index: false, follow: false },
};

export default async function FreshnessPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/freshness");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">Administrators only.</p>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { live: true },
    include: { provider: { select: { name: true } } },
  });

  const withFreshness = products
    .map((p) => ({ p, ...freshnessOf(p.lastVerifiedAt) }))
    .sort((a, b) => b.days - a.days); // oldest first

  const counts = { fresh: 0, aging: 0, stale: 0 };
  for (const w of withFreshness) counts[w.status]++;

  // Needing attention = aging + stale, oldest first.
  const attention = withFreshness.filter((w) => w.status !== "fresh");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Clock className="h-6 w-6 text-brand" /> Rate freshness
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Figures are <strong>ageing</strong> after {AGING_AFTER_DAYS} days and{" "}
        <strong>stale</strong> after {STALE_AFTER_DAYS} days. Re-run{" "}
        <code>npm run ingest</code> (or the scheduled refresh) to stage updates,
        or mark a product re-checked once you&apos;ve confirmed it.
      </p>
      <p className="mt-1 text-sm">
        <Link href="/admin/ingestion" className="text-brand hover:underline">Ingestion</Link>{" "}·{" "}
        <Link href="/admin/reviews" className="text-brand hover:underline">Reviews</Link>{" "}·{" "}
        <Link href="/admin/revenue" className="text-brand hover:underline">Revenue</Link>
      </p>

      {/* Summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Fresh" value={counts.fresh} tone="muted" />
        <Stat label="Ageing" value={counts.aging} tone="aging" />
        <Stat label="Stale" value={counts.stale} tone="stale" />
      </div>

      {/* Needs attention */}
      <h2 className="mt-8 text-lg font-semibold">
        Needs re-checking ({attention.length})
      </h2>
      <div className="mt-3 space-y-2">
        {attention.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            Everything is fresh. 🎉
          </p>
        ) : (
          attention.map(({ p, status, days }) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Link
                href={`/product/${p.slug}`}
                className="font-medium hover:text-brand"
              >
                {p.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {p.provider.name} · {p.country}
              </span>
              <Badge variant={status === "stale" ? "gold" : "neutral"}>
                {status === "stale" ? "Stale" : "Ageing"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                checked {days}d ago ({formatDate(p.lastVerifiedAt)})
              </span>
              <form
                action={markProductVerified.bind(null, p.id)}
                className="ml-auto"
              >
                <button
                  type="submit"
                  className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  Mark re-checked
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "aging" | "stale";
}) {
  const color =
    tone === "stale"
      ? "text-gold"
      : tone === "aging"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
