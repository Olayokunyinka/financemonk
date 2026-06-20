import Link from "next/link";
import { SITE } from "@/lib/site";
import { hubHref } from "@/lib/taxonomy";
import { listHubs } from "@/lib/queries";

// The footer is a primary SEO surface: the country × family link mesh feeds
// crawl equity into the deep hub pages. It is driven by real published hubs so
// we never link to empty pages. Also carries the named editorial responsibility
// (E-E-A-T) and the standing disclaimer.
export async function SiteFooter() {
  const hubs = await listHubs();
  const countries = Array.from(
    new Map(hubs.map((h) => [h.country.code, h.country])).values(),
  );

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
            {countries.map((c) => {
              const first = hubs.find((h) => h.country.code === c.code)!;
              return (
                <li key={c.code}>
                  <Link
                    href={hubHref(c.code, first.family.slug)}
                    className="hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">Popular comparisons</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {hubs.map((h) => (
              <li key={`${h.country.code}-${h.family.slug}`}>
                <Link
                  href={hubHref(h.country.code, h.family.slug)}
                  className="hover:text-foreground"
                >
                  Best {h.family.label} in {h.country.name}
                </Link>
              </li>
            ))}
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
                Editorial &amp; data standards
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
