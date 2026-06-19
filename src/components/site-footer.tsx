import Link from "next/link";
import { SITE } from "@/lib/site";
import { COUNTRIES, FAMILIES, hubHref } from "@/lib/taxonomy";

// The footer is a primary SEO surface: the country × family link mesh feeds
// crawl equity into the deep hub pages. It also carries the named editorial
// responsibility (E-E-A-T) and the standing disclaimer.
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-semibold">{SITE.name}</div>
          <p className="mt-2 text-sm text-muted-foreground">{SITE.tagline}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Editorial responsibility:{" "}
            <span className="font-medium text-foreground">
              {SITE.editorial.responsibleName}
            </span>
            <br />
            {SITE.editorial.responsibleTitle}
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold">Compare by country</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {Object.values(COUNTRIES).map((c) => (
              <li key={c.code}>
                <Link
                  href={hubHref(c.code, Object.values(FAMILIES)[0].slug)}
                  className="hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">Popular comparisons</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {Object.values(COUNTRIES).flatMap((c) =>
              Object.values(FAMILIES).map((f) => (
                <li key={`${c.code}-${f.slug}`}>
                  <Link
                    href={hubHref(c.code, f.slug)}
                    className="hover:text-foreground"
                  >
                    Best {f.label} in {c.name}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">Trust</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/methodology" className="hover:text-foreground">
                How we compare
              </Link>
            </li>
            <li>
              <Link href="/methodology#editorial" className="hover:text-foreground">
                Editorial & data standards
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          <p>
            All rates, fees and terms are indicative only and may change — always
            confirm directly with the provider before applying. {SITE.name} is an
            independent comparison service and does not provide financial advice.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {SITE.name}. Seed data shown for
            demonstration.
          </p>
        </div>
      </div>
    </footer>
  );
}
