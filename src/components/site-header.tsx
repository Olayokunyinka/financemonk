import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { SITE } from "@/lib/site";
import { AuthNav } from "@/components/auth-nav";

// Static server component (no auth() call) so all directory/SEO pages stay
// statically generated and the browse nav is always present for crawlers
// (Nav-Footer-Global-Standard §2, §6). Only the right side (<AuthNav>) is a
// client island that changes by role. The Browse dropdown is pure CSS
// (group-hover + focus-within) so every link is in the DOM and crawlable —
// never gated behind JS.

// Left-side browse nav. The "By country" entry points at search where all
// country × family hubs are reachable.
const BROWSE = [
  { href: "/ng/personal-loans", label: "Personal loans" },
  { href: "/ng/savings-accounts", label: "Savings" },
  { href: "/ng/credit-cards", label: "Cards" },
  { href: "/ng/health-insurance", label: "Insurance" },
  { href: "/search", label: "By country" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center" aria-label={SITE.name}>
            <Image
              src="/logo.png"
              alt={SITE.name}
              width={196}
              height={47}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {/* Browse ▼ — CSS-only dropdown; links always rendered (crawlable). */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 py-2 hover:text-foreground group-focus-within:text-foreground"
                aria-haspopup="true"
              >
                Browse
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-0 top-full z-40 w-52 rounded-lg border border-border bg-background p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {BROWSE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/compare" className="hover:text-foreground">
              Compare
            </Link>
            <Link href="/calculators" className="hover:text-foreground">
              Calculators
            </Link>
            <Link href="/guides" className="hover:text-foreground">
              Guides
            </Link>
          </nav>
        </div>

        <AuthNav />
      </div>
    </header>
  );
}
