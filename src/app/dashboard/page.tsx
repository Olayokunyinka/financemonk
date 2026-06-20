import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProvidersClaimedBy } from "@/lib/providers";
import { formatApr, formatDate, formatCurrency, type FeeItem } from "@/lib/format";
import { freshnessOf } from "@/lib/freshness";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/rating-stars";
import { LastVerified } from "@/components/disclaimer";
import {
  updateProduct,
  confirmCurrent,
  respondToReview,
  updateLeadStatus,
} from "./actions";

export const metadata: Metadata = {
  title: "Provider dashboard",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ claimed?: string }>;

export default async function DashboardPage(props: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/dashboard");
  const { claimed } = await props.searchParams;

  const providers = await getProvidersClaimedBy(session.user.id);

  if (providers.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <LayoutDashboard className="mx-auto h-10 w-10 text-brand" />
        <h1 className="mt-4 text-2xl font-bold">No claimed listings yet</h1>
        <p className="mt-2 text-muted-foreground">
          Claim a provider to manage its products, refresh rates, respond to
          reviews and see applications.
        </p>
        <Link
          href="/claim"
          className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-brand-foreground hover:bg-brand/90"
        >
          Claim a listing
        </Link>
      </div>
    );
  }

  const productIds = providers.flatMap((p) => p.products.map((x) => x.id));
  const reviews = await prisma.review.findMany({
    where: { productId: { in: productIds }, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  const leads = await prisma.lead.findMany({
    where: { providerId: { in: providers.map((p) => p.id) } },
    include: { product: { select: { name: true, providerId: true } } },
    orderBy: { createdAt: "desc" },
  });
  const commissions = await prisma.commission.findMany({
    where: { providerId: { in: providers.map((p) => p.id) } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <LayoutDashboard className="h-6 w-6 text-brand" /> Provider dashboard
      </h1>

      {claimed ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" />
          Claim approved — you now manage the listings below.
        </div>
      ) : null}

      {providers.map((provider) => {
        const avg =
          provider.products.reduce((s, p) => s + p.ratingAggregate, 0) /
          (provider.products.length || 1);
        const provLeads = leads.filter((l) =>
          provider.products.some((p) => p.id === l.productId),
        );
        const provCommissions = commissions.filter(
          (c) => c.providerId === provider.id,
        );
        const referralCurrency =
          provCommissions[0]?.currency ??
          provider.products[0]?.currency ??
          "NGN";
        const referralBilled = provCommissions.reduce(
          (s, c) => s + c.amount,
          0,
        );
        return (
          <section key={provider.id} className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              {provider.licensed ? (
                <Badge variant="gold">Verified · {provider.licenseSource}</Badge>
              ) : (
                <Badge variant="outline">Not on register</Badge>
              )}
            </div>

            {/* Overview stats */}
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <Stat label="Products" value={String(provider.products.length)} />
              <Stat
                label="Avg. rating"
                value={avg > 0 ? avg.toFixed(1) : "—"}
              />
              <Stat label="Applications" value={String(provLeads.length)} />
              <Stat
                label="Referral billed"
                value={formatCurrency(referralBilled, referralCurrency)}
              />
            </div>

            {/* Products */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Products</h3>
              {(() => {
                const stale = provider.products.filter(
                  (p) => freshnessOf(p.lastVerifiedAt).status !== "fresh",
                ).length;
                return stale > 0 ? (
                  <span className="text-xs text-gold">
                    {stale} product{stale === 1 ? "" : "s"} need re-confirming —
                    open one and click “Confirm current”.
                  </span>
                ) : null;
              })()}
            </div>
            <div className="mt-2 space-y-3">
              {provider.products.map((p) => {
                const fee = (p.fees as FeeItem[])?.[0];
                return (
                  <details
                    key={p.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatApr(p.aprMin, p.aprMax)} p.a.</span>
                        <LastVerified date={p.lastVerifiedAt} />
                      </span>
                    </summary>

                    {/* Confirm current */}
                    <form
                      action={confirmCurrent.bind(null, p.id)}
                      className="mt-3"
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        Confirm current (refresh last-verified date)
                      </button>
                    </form>

                    {/* Edit terms */}
                    <form
                      action={updateProduct.bind(null, p.id)}
                      className="mt-4 grid gap-3 sm:grid-cols-2"
                    >
                      <Field label="Summary" full>
                        <input
                          name="summary"
                          defaultValue={p.summary ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Interest min (% p.a.)">
                        <input
                          name="aprMin"
                          type="number"
                          step="0.1"
                          defaultValue={p.aprMin ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Interest max (% p.a.)">
                        <input
                          name="aprMax"
                          type="number"
                          step="0.1"
                          defaultValue={p.aprMax ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Management fee (%)">
                        <input
                          name="feePct"
                          type="number"
                          step="0.1"
                          defaultValue={fee?.amount ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Min amount (₦)">
                        <input
                          name="minAmount"
                          type="number"
                          defaultValue={p.minAmount ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Max amount (₦)">
                        <input
                          name="maxAmount"
                          type="number"
                          defaultValue={p.maxAmount ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Min tenure (months)">
                        <input
                          name="minTenureMonths"
                          type="number"
                          defaultValue={p.minTenureMonths ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Max tenure (months)">
                        <input
                          name="maxTenureMonths"
                          type="number"
                          defaultValue={p.maxTenureMonths ?? ""}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3"
                        />
                      </Field>
                      <Field label="Eligibility (one per line)" full>
                        <textarea
                          name="eligibility"
                          rows={3}
                          defaultValue={p.eligibility.join("\n")}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="h-10 rounded-lg bg-brand px-5 font-medium text-brand-foreground hover:bg-brand/90"
                        >
                          Save &amp; confirm
                        </button>
                      </div>
                    </form>
                  </details>
                );
              })}
            </div>

            {/* Reviews to respond to */}
            <h3 className="mt-6 font-semibold">Reviews</h3>
            <div className="mt-2 space-y-3">
              {reviews.filter((r) =>
                provider.products.some((p) => p.id === r.productId),
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No published reviews yet.
                </p>
              ) : (
                reviews
                  .filter((r) =>
                    provider.products.some((p) => p.id === r.productId),
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <RatingStars value={r.overall} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 font-medium">{r.title}</div>
                      <p className="text-sm text-muted-foreground">{r.body}</p>
                      {r.ownerResponse ? (
                        <div className="mt-2 rounded-lg bg-muted p-3 text-sm">
                          <span className="font-medium">Your response: </span>
                          {r.ownerResponse}
                        </div>
                      ) : null}
                      <form
                        action={respondToReview.bind(null, r.id)}
                        className="mt-3 flex gap-2"
                      >
                        <input
                          name="response"
                          defaultValue={r.ownerResponse ?? ""}
                          placeholder="Write a public response…"
                          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                        />
                        <button
                          type="submit"
                          className="h-10 rounded-lg border border-border px-4 text-sm hover:bg-muted"
                        >
                          {r.ownerResponse ? "Update" : "Respond"}
                        </button>
                      </form>
                    </div>
                  ))
              )}
            </div>

            {/* Applications / leads */}
            <h3 className="mt-6 font-semibold">Applications</h3>
            <div className="mt-2 space-y-2">
              {leads.filter((l) =>
                provider.products.some((p) => p.id === l.productId),
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No applications yet.
                </p>
              ) : (
                leads
                  .filter((l) =>
                    provider.products.some((p) => p.id === l.productId),
                  )
                  .map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{l.fullName}</span>
                      <span className="text-muted-foreground">
                        {l.product.name}
                      </span>
                      {l.amount ? (
                        <span className="text-muted-foreground">
                          {formatCurrency(l.amount)}
                        </span>
                      ) : null}
                      <Badge
                        variant={
                          l.status === "CONVERTED"
                            ? "brand"
                            : l.status === "REJECTED"
                              ? "outline"
                              : "neutral"
                        }
                      >
                        {l.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(l.createdAt)}
                      </span>
                      <form
                        action={updateLeadStatus.bind(null, l.id, "CONVERTED")}
                        className="ml-auto"
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          Mark converted
                        </button>
                      </form>
                    </div>
                  ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
