import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Account settings",
};

// Consumer account home. The layout already gates this (signed-in only), so we
// can read the session directly for display.
export default async function AccountPage() {
  const session = await auth();
  const user = session!.user!;
  const role = user.role ?? "USER";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Account settings</h1>

      <dl className="mt-8 divide-y divide-border rounded-2xl border border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd className="text-sm font-medium">{user.name ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="text-sm font-medium">{user.email}</dd>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <dt className="text-sm text-muted-foreground">Account type</dt>
          <dd>
            <Badge variant={role === "ADMIN" ? "gold" : "neutral"}>{role}</Badge>
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          href="/account/reviews"
          className="rounded-xl border border-border px-4 py-3 text-center text-sm hover:bg-muted"
        >
          My reviews
        </Link>
        <Link
          href="/account/saved"
          className="rounded-xl border border-border px-4 py-3 text-center text-sm hover:bg-muted"
        >
          Saved &amp; comparisons
        </Link>
        <Link
          href="/account/alerts"
          className="rounded-xl border border-border px-4 py-3 text-center text-sm hover:bg-muted"
        >
          Alerts
        </Link>
      </div>

      {role === "USER" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Represent a provider?{" "}
          <Link href="/claim" className="text-brand hover:underline">
            Claim a listing
          </Link>{" "}
          to manage products and respond to reviews.
        </p>
      ) : null}

      <div className="mt-8">
        <a
          href="/api/auth/signout"
          className="inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}
