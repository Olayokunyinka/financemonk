import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RatingStars } from "@/components/rating-stars";
import { Badge } from "@/components/ui/badge";
import { approveReview, rejectReview } from "./actions";

export const metadata: Metadata = {
  title: "Moderation queue",
  robots: { index: false, follow: false },
};

export default async function ModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/reviews");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">
          The moderation queue is for administrators only.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-brand hover:underline">
            ← Home
          </Link>
        </p>
      </div>
    );
  }

  const pending = await prisma.review.findMany({
    where: { status: "PENDING" },
    include: { product: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const recent = await prisma.review.findMany({
    where: { status: { in: ["PUBLISHED", "REJECTED"] } },
    include: { product: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <ShieldCheck className="h-6 w-6 text-brand" /> Moderation queue
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pending.length} review{pending.length === 1 ? "" : "s"} awaiting
        approval. Approved reviews go live and update the product rating.
      </p>

      <div className="mt-6 space-y-4">
        {pending.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            Nothing pending. 🎉
          </p>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/product/${r.product.slug}`}
                  className="font-medium hover:text-brand"
                >
                  {r.product.name}
                </Link>
                <RatingStars value={r.overall} />
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{r.authorName ?? "Anonymous"}</span>
                <Badge
                  variant={
                    r.reviewerType === "VERIFIED_CUSTOMER" ? "brand" : "neutral"
                  }
                >
                  {r.reviewerType === "VERIFIED_CUSTOMER"
                    ? "Verified customer"
                    : "Customer"}
                </Badge>
                <span>{formatDate(r.createdAt)}</span>
              </div>
              <div className="mt-2 font-medium">{r.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>

              <div className="mt-3 flex gap-2">
                <form action={approveReview.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
                  >
                    Approve &amp; publish
                  </button>
                </form>
                <form action={rejectReview.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="h-9 rounded-lg border border-border px-4 text-sm hover:bg-muted"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Recently moderated</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">
                    {r.product.name} —{" "}
                  </span>
                  {r.title}
                </span>
                <Badge variant={r.status === "PUBLISHED" ? "brand" : "outline"}>
                  {r.status === "PUBLISHED" ? "Published" : "Rejected"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
