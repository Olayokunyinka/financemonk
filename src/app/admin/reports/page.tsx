import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flag } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { takedownReport, dismissReport } from "./actions";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/reports");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">Administrators only.</p>
      </div>
    );
  }

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: {
      review: {
        include: { product: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Flag className="h-6 w-6 text-brand" /> Reported reviews
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {reports.length} open report{reports.length === 1 ? "" : "s"}. Taking down
        a review hides it publicly and updates the product rating.
      </p>
      <p className="mt-1 text-sm">
        <Link href="/admin/reviews" className="text-brand hover:underline">
          Moderation queue
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        {reports.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            No open reports.
          </p>
        ) : (
          reports.map((rep) => (
            <div key={rep.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">{rep.reason}</Badge>
                <Link
                  href={`/product/${rep.review.product.slug}`}
                  className="text-sm font-medium hover:text-brand"
                >
                  {rep.review.product.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDate(rep.createdAt)}
                </span>
                <Badge
                  variant={
                    rep.review.status === "PUBLISHED" ? "neutral" : "outline"
                  }
                >
                  review: {rep.review.status}
                </Badge>
              </div>
              {rep.detail ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Reporter note: {rep.detail}
                </p>
              ) : null}
              <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                <div className="font-medium">{rep.review.title}</div>
                <p className="mt-1 text-muted-foreground">{rep.review.body}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <form action={takedownReport.bind(null, rep.id)}>
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Take down review
                  </button>
                </form>
                <form action={dismissReport.bind(null, rep.id)}>
                  <button
                    type="submit"
                    className="h-9 rounded-lg border border-border px-4 text-sm hover:bg-muted"
                  >
                    Dismiss report
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
