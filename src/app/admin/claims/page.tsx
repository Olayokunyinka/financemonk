import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { approveClaim, rejectClaim } from "./actions";

export const metadata: Metadata = {
  title: "Claim queue",
  robots: { index: false, follow: false },
};

export default async function ClaimQueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/claims");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">Administrators only.</p>
      </div>
    );
  }

  const pending = await prisma.claim.findMany({
    where: { status: "PENDING" },
    include: {
      provider: { select: { name: true, licensed: true, licenseSource: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <ShieldCheck className="h-6 w-6 text-brand" /> Claim queue
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pending.length} claim{pending.length === 1 ? "" : "s"} awaiting review.
        Approving marks the provider claimed and (if licensed) turns its products
        gold-verified.
      </p>
      <p className="mt-1 text-sm">
        <Link href="/admin/reviews" className="text-brand hover:underline">
          → Review moderation queue
        </Link>
      </p>

      <div className="mt-6 space-y-4">
        {pending.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            No claims pending.
          </p>
        ) : (
          pending.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.provider.name}</span>
                {c.provider.licensed ? (
                  <Badge variant="gold">Licensed</Badge>
                ) : (
                  <Badge variant="outline">Not on register</Badge>
                )}
                <Badge variant="neutral">{c.method}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                By {c.user.name ?? c.user.email} · evidence:{" "}
                <span className="font-mono">{c.evidence}</span> ·{" "}
                {formatDate(c.createdAt)}
              </div>
              <div className="mt-3 flex gap-2">
                <form action={approveClaim.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
                  >
                    Approve claim
                  </button>
                </form>
                <form action={rejectClaim.bind(null, c.id)}>
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
    </div>
  );
}
