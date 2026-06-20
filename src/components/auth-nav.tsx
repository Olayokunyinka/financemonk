"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

// Client island for auth state, so the server layout stays static (SEO).
export function AuthNav() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  if (status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />;
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isAdmin ? (
        <Link
          href="/admin/reviews"
          className="hidden items-center gap-1 text-sm text-brand hover:underline sm:inline-flex"
        >
          <ShieldCheck className="h-4 w-4" /> Moderation
        </Link>
      ) : null}
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name ?? user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Sign out
      </button>
    </div>
  );
}
