import Link from "next/link";
import { Landmark } from "lucide-react";
import { SITE } from "@/lib/site";
import { AuthNav } from "@/components/auth-nav";

// Static server component (no auth() call) so all directory/SEO pages remain
// statically generated. Auth state is rendered by the <AuthNav> client island.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Landmark className="h-4 w-4" />
          </span>
          <span>{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/ng/personal-loans" className="hover:text-foreground">
            Personal loans
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link href="/methodology" className="hover:text-foreground">
            How we compare
          </Link>
        </nav>

        <AuthNav />
      </div>
    </header>
  );
}
