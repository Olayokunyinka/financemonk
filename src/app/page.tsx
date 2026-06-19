import Link from "next/link";
import { Search, Calculator, ShieldCheck, BadgeCheck } from "lucide-react";
import { getFeaturedProducts } from "@/lib/queries";
import { COUNTRIES, FAMILIES, hubHref } from "@/lib/taxonomy";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

// Homepage is statically generated and revalidated (ISR). Browsing is fully
// open to crawlers.
export const revalidate = 3600;

export default async function HomePage() {
  const featured = await getFeaturedProducts(4);
  const families = Object.values(FAMILIES);
  const countries = Object.values(COUNTRIES);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-brand-muted/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Compare financial products across Africa
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Independent, structured comparison of real rates, fees and terms —
            with reviews and licence-checked providers. Start with personal loans
            in Nigeria.
          </p>

          {/* Search funnels to the comparison hub (faceted /search arrives in
              Milestone 2). */}
          <form
            action="/ng/personal-loans"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                placeholder="Search personal loans, providers…"
                className="h-12 w-full rounded-lg border border-border bg-background pl-9 pr-3"
              />
            </div>
            <ButtonLink href="/ng/personal-loans" size="lg">
              Compare
            </ButtonLink>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Popular:</span>
            {countries.flatMap((c) =>
              families.map((f) => (
                <Link
                  key={`${c.code}-${f.slug}`}
                  href={hubHref(c.code, f.slug)}
                  className="rounded-full border border-border bg-background px-3 py-1 hover:border-brand hover:text-brand"
                >
                  Best {f.label} in {c.name}
                </Link>
              )),
            )}
            <Link
              href="/calculators/loan-repayment"
              className="rounded-full border border-border bg-background px-3 py-1 hover:border-brand hover:text-brand"
            >
              Loan calculator
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
        {/* Trust strip (E-E-A-T) */}
        <section className="grid gap-4 sm:grid-cols-3">
          <TrustItem
            icon={<BadgeCheck className="h-5 w-5 text-gold" />}
            title="Licence-checked"
            body="Only products from CBN-licensed institutions. Gold badge means licensed and claimed."
          />
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5 text-brand" />}
            title="Indicative & dated"
            body="Every figure carries a last-verified date and an 'indicative — confirm with provider' note."
          />
          <TrustItem
            icon={<Search className="h-5 w-5 text-brand" />}
            title="Independent"
            body="We compare on the merits. Sponsored placements are always clearly labelled."
          />
        </section>

        {/* Browse by country / category */}
        <section className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Browse by country</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={hubHref(c.code, families[0].slug)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:border-brand hover:text-brand"
                >
                  {c.name}
                </Link>
              ))}
              <span className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">
                More countries soon
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Browse by product</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {families.map((f) => (
                <Link
                  key={f.slug}
                  href={hubHref(countries[0].code, f.slug)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:border-brand hover:text-brand"
                >
                  {f.labelTitle}
                </Link>
              ))}
              <span className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground">
                Savings, cards, insurance soon
              </span>
            </div>
          </div>
        </section>

        {/* Featured / verified */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured &amp; verified</h2>
            <Link
              href="/ng/personal-loans"
              className="text-sm text-brand hover:underline"
            >
              See all personal loans →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sponsored placements are labelled. Verified = licensed and claimed.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <Disclaimer className="mt-4" />
        </section>

        {/* Calculator teaser */}
        <section className="rounded-2xl border border-border bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Calculator className="mt-1 h-6 w-6 text-brand" />
            <div>
              <h2 className="text-lg font-semibold">
                Work out what a loan really costs
              </h2>
              <p className="text-sm text-muted-foreground">
                Estimate your monthly repayment and total cost, then jump
                straight to matching products.
              </p>
            </div>
          </div>
          <ButtonLink
            href="/calculators/loan-repayment"
            variant="outline"
            className="mt-4 sm:mt-0"
          >
            Open loan calculator
          </ButtonLink>
        </section>

        {/* Popular "best of" internal links (SEO mesh) */}
        <section>
          <h2 className="text-lg font-semibold">Popular comparisons</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {countries.flatMap((c) =>
              families.map((f) => (
                <li key={`${c.code}-${f.slug}`}>
                  <Link
                    href={hubHref(c.code, f.slug)}
                    className="text-brand hover:underline"
                  >
                    Best {f.label} in {c.name} (2026)
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
