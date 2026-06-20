import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { setPayout, markCommissionPaid } from "./actions";

export const metadata: Metadata = {
  title: "Revenue",
  robots: { index: false, follow: false },
};

export default async function RevenuePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/revenue");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">Administrators only.</p>
      </div>
    );
  }

  const commissions = await prisma.commission.findMany({
    include: {
      lead: {
        select: {
          fullName: true,
          product: { select: { name: true, provider: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Totals by currency (earned) and pending vs paid.
  const byCurrency = new Map<string, { total: number; pending: number }>();
  for (const c of commissions) {
    const cur = byCurrency.get(c.currency) ?? { total: 0, pending: 0 };
    cur.total += c.amount;
    if (c.status === "PENDING") cur.pending += c.amount;
    byCurrency.set(c.currency, cur);
  }

  // Products with applications — the relevant set for editing deal payouts.
  const dealProducts = await prisma.product.findMany({
    where: { leads: { some: {} } },
    include: {
      provider: { select: { name: true, licensed: true } },
      _count: { select: { leads: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Coins className="h-6 w-6 text-brand" /> CPA revenue
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Commissions are recorded when a provider marks an application{" "}
        <strong>converted</strong> and the product has a deal payout. Figures are
        for reconciliation; enabling live billing also requires{" "}
        <code>CPA_ENABLED</code> and per-country licensing.
      </p>
      <p className="mt-1 text-sm">
        <Link href="/admin/reviews" className="text-brand hover:underline">
          Reviews
        </Link>{" "}
        ·{" "}
        <Link href="/admin/claims" className="text-brand hover:underline">
          Claims
        </Link>
      </p>

      {/* Totals */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {byCurrency.size === 0 ? (
          <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground sm:col-span-3">
            No commissions yet. Submit an application (Apply) and mark it
            converted in the provider dashboard to see revenue here.
          </div>
        ) : (
          [...byCurrency.entries()].map(([cur, v]) => (
            <div key={cur} className="rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">
                Earned ({cur})
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatCurrency(v.total, cur)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(v.pending, cur)} pending payout
              </div>
            </div>
          ))
        )}
      </div>

      {/* Commissions */}
      {commissions.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Commissions</h2>
          <div className="mt-2 space-y-2">
            {commissions.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {formatCurrency(c.amount, c.currency)}
                </span>
                <span className="text-muted-foreground">
                  {c.lead.product.provider.name} — {c.lead.product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.lead.fullName} · {formatDate(c.createdAt)}
                </span>
                <Badge variant={c.status === "PAID" ? "brand" : "neutral"}>
                  {c.status}
                </Badge>
                {c.status === "PENDING" ? (
                  <form
                    action={markCommissionPaid.bind(null, c.id)}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                    >
                      Mark paid
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Deal payout config */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Deal payouts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the CPA payout per converted application for products that have
          received enquiries. (Other products inherit a seeded default.)
        </p>
        <div className="mt-3 space-y-2">
          {dealProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            dealProducts.map((p) => (
              <form
                key={p.id}
                action={setPayout.bind(null, p.id)}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.provider.name} · {p._count.leads} application(s)
                </span>
                {!p.provider.licensed ? (
                  <Badge variant="outline">Unlicensed — no deal</Badge>
                ) : null}
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Payout ({p.currency})
                  </span>
                  <input
                    name="cpaPayout"
                    type="number"
                    step="0.01"
                    defaultValue={p.cpaPayout ?? ""}
                    placeholder="—"
                    className="h-9 w-28 rounded-lg border border-border bg-background px-2"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-brand px-3 text-xs font-medium text-brand-foreground hover:bg-brand/90"
                  >
                    Save
                  </button>
                </span>
              </form>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
