"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// The footer's ONLY role-aware element (Nav-Footer-Global-Standard §3): a
// provider who is signed in sees "Provider dashboard"; everyone else sees
// "Provider login". Isolated into a tiny client island so the rest of the footer
// (the SEO link-mesh) stays static and crawlable.
export function ProviderFooterLink() {
  const { data: session } = useSession();
  const isBusiness = session?.user?.role === "BUSINESS";

  return isBusiness ? (
    <Link href="/dashboard" className="hover:text-foreground">
      Provider dashboard
    </Link>
  ) : (
    <Link href="/signin" className="hover:text-foreground">
      Provider login
    </Link>
  );
}
