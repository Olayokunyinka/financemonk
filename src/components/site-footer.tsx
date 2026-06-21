import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { hubHref, currencyOf } from "@/lib/taxonomy";
import { listHubs } from "@/lib/queries";
import { ProviderFooterLink } from "@/components/provider-footer-link";
import { CountryCurrencySelect } from "@/components/country-currency-select";

// The footer is a primary SEO surface: the country × family link mesh feeds
// crawl equity into the deep hub pages, so it is server-rendered and identical
// for every visitor incl. Googlebot (Nav-Footer-Global-Standard §3, §6). It is
// driven by real published hubs so we never link to empty pages. Only the single
// "Provider login → dashboard" link is role-aware (a tiny client island). Also
// carries the named editorial responsibility (E-E-A-T) and the standing
// disclaimer (finance guardrail). The admin shell does NOT render this footer.
export async function SiteFooter() {
  const hubs = await listHubs();

  const countries = Array.from(
    new Map(hubs.map((h) => [h.country.code, h.country])).values(),
  );
  // Distinct families across live hubs, each linked to a representative hub.
  const families = Array.from(
    new Map(hubs.map((h) => [h.family.slug, h])).values(),
  );
  // Country/currency switcher options → each country's first live hub.
  const countryOptions = countries.map((c) => {
    const first = hubs.find((h) => h.country.code === c.code)!;
    return {
      code: c.code,
      name: c.name,
      currency: currencyOf(c.code),
      href: hubHref(c.code, first.family.slug),
    };
  });

  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Link mesh — four columns */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Browse by country
            </div>
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
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Browse by product
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {families.map((h) => (
                <li key={h.family.slug}>
                  <Link
                    href={hubHref(h.country.code, h.family.slug)}
                    className="hover:text-foreground"
                  >
                    {h.family.labelTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Popular comparisons
            </div>
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
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Company
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-foreground">
                  How we compare
                </Link>
              </li>
              <li>
                <Link
                  href="/methodology#editorial"
                  className="hover:text-foreground"
                >
                  Editorial standards
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Editorial responsibility:{" "}
              <span className="font-medium text-foreground">
                {SITE.editorial.responsibleName}
              </span>
              <br />
              {SITE.editorial.responsibleTitle}
            </p>
          </div>
        </div>

        {/* For business + legal lines */}
        <div className="mt-10 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">For business:</span>
            <Link href="/claim" className="hover:text-foreground">
              Claim your listing
            </Link>
            <span aria-hidden>·</span>
            <Link href="/advertise" className="hover:text-foreground">
              Advertise
            </Link>
            <span aria-hidden>·</span>
            <ProviderFooterLink />
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">Legal:</span>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/disclaimer" className="hover:text-foreground">
              Disclaimer
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cookies" className="hover:text-foreground">
              Cookie policy
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt={SITE.name}
              width={1217}
              height={390}
              className="h-8 w-auto"
            />
            <span>
              © {new Date().getFullYear()} {SITE.name}
            </span>
          </div>
          <CountryCurrencySelect options={countryOptions} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-6 text-xs text-muted-foreground">
          <p>
            Rates indicative — verify with the provider. All rates, fees and terms
            may change; always confirm directly before applying. {SITE.name} is an
            independent comparison service and does not provide financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
