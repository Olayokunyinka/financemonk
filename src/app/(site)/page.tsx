import Link from "next/link";
import {
  Search,
  Banknote,
  PiggyBank,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Send,
  Calculator,
  BadgeCheck,
  ScrollText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  getFeaturedProducts,
  listHubs,
  getDirectoryStats,
  getLiveProductCounts,
} from "@/lib/queries";
import { hubHref, type Family, type FamilyKind } from "@/lib/taxonomy";
import { SITE } from "@/lib/site";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

// Homepage is statically generated and revalidated (ISR). Browsing is fully
// open to crawlers. The page is organised around the directory's information
// architecture: search → product categories → proof (featured + trust) →
// countries → tools → SEO link-mesh.
export const revalidate = 3600;

// Product categories (one per family `kind`) — the primary navigation of the
// directory. Order and copy are intentional; families inside each are derived
// from real published hubs so nothing links to an empty page.
const CATEGORIES: {
  kind: FamilyKind;
  label: string;
  blurb: string;
  icon: LucideIcon;
}[] = [
  { kind: "loan", label: "Loans & credit", blurb: "Personal, business, payday, asset finance & mortgages", icon: Banknote },
  { kind: "deposit", label: "Savings & accounts", blurb: "Savings, current, fixed-deposit & domiciliary accounts", icon: PiggyBank },
  { kind: "card", label: "Cards", blurb: "Credit, debit, prepaid & virtual cards", icon: CreditCard },
  { kind: "insurance", label: "Insurance", blurb: "Health, motor, life, travel, business & agric", icon: ShieldCheck },
  { kind: "investment", label: "Investments & pensions", blurb: "Mutual funds, money market, fixed income & pensions", icon: TrendingUp },
  { kind: "payments", label: "Payments & transfers", blurb: "Local transfers, remittance & foreign exchange", icon: Send },
];

const CALCULATORS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/calculators/loan-repayment", label: "Loan repayment", icon: Banknote },
  { href: "/calculators/savings-growth", label: "Savings growth", icon: PiggyBank },
  { href: "/calculators/investment-growth", label: "Investment growth", icon: TrendingUp },
  { href: "/calculators/insurance-needs", label: "Insurance needs", icon: ShieldCheck },
  { href: "/calculators/remittance-cost", label: "Remittance cost", icon: Send },
  { href: "/calculators/credit-card-cost", label: "Credit-card cost", icon: CreditCard },
];

const nf = new Intl.NumberFormat("en-US");

export default async function HomePage() {
  const [featured, hubs, stats, counts] = await Promise.all([
    getFeaturedProducts(4),
    listHubs(),
    getDirectoryStats(),
    getLiveProductCounts(),
  ]);

  // Real countries/families from published hubs (no empty links).
  const countries = Array.from(
    new Map(hubs.map((h) => [h.country.code, h.country])).values(),
  );
  const firstHubForFamily = (slug: string) =>
    hubs.find((h) => h.family.slug === slug)!;

  // Distinct families available, grouped by category (kind).
  const familiesByKind = new Map<FamilyKind, Family[]>();
  const seen = new Set<string>();
  for (const h of hubs) {
    if (seen.has(h.family.slug)) continue;
    seen.add(h.family.slug);
    const list = familiesByKind.get(h.family.kind) ?? [];
    list.push(h.family);
    familiesByKind.set(h.family.kind, list);
  }

  // Live-product count for a family (summed across countries).
  const familyCount = (type: string) => {
    let n = 0;
    for (const [key, c] of counts) if (key.endsWith(`:${type}`)) n += c;
    return n;
  };
  // Live-product count for a country (summed across its families).
  const countryCount = (code: string) => {
    let n = 0;
    for (const [key, c] of counts) if (key.startsWith(`${code}:`)) n += c;
    return n;
  };

  return (
    <div>
      {/* ---- Hero ---------------------------------------------------------- */}
      <section className="border-b border-border bg-gradient-to-b from-brand-muted/50 via-brand-muted/10 to-background">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-16 text-center sm:pt-20">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 ring-1 ring-border">
              <BadgeCheck className="h-3.5 w-3.5 text-gold" /> Licence-checked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 ring-1 ring-border">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Independent
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 ring-1 ring-border">
              <Send className="h-3.5 w-3.5 text-brand" /> Pan-African
            </span>
          </div>

          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Compare financial products across Africa
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {SITE.description}
          </p>

          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                placeholder="Search loans, savings, cards, insurance…"
                aria-label="Search financial products"
                className="h-12 w-full rounded-lg border border-border bg-background pl-9 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <ButtonLink href="/search" size="lg">
              Search
            </ButtonLink>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            {CATEGORIES.map((c) => {
              const fams = familiesByKind.get(c.kind);
              if (!fams?.length) return null;
              const first = firstHubForFamily(fams[0].slug);
              return (
                <Link
                  key={c.kind}
                  href={hubHref(first.country.code, fams[0].slug)}
                  className="rounded-full border border-border bg-background px-3 py-1 hover:border-brand hover:text-brand"
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Stats bar ----------------------------------------------------- */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-0 sm:grid-cols-4">
          <Stat value={nf.format(stats.products)} label="Products compared" />
          <Stat value={nf.format(stats.providers)} label="Providers" />
          <Stat
            value={nf.format(stats.licensedProviders)}
            label="Licence-checked"
          />
          <Stat value={nf.format(countries.length)} label="Countries" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14">
        {/* ---- Browse by category (the core IA) --------------------------- */}
        <section>
          <SectionHead
            title="Browse by category"
            subtitle="Every product structured so the rates, fees and terms line up side by side."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const fams = familiesByKind.get(cat.kind);
              if (!fams?.length) return null;
              const total = fams.reduce((s, f) => s + familyCount(f.type), 0);
              return (
                <div
                  key={cat.kind}
                  className="group flex flex-col rounded-2xl border border-border p-5 transition-colors hover:border-brand/60"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                      <cat.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">{cat.blurb}</p>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {fams.map((f) => {
                      const h = firstHubForFamily(f.slug);
                      return (
                        <li key={f.slug}>
                          <Link
                            href={hubHref(h.country.code, f.slug)}
                            className="inline-block rounded-md bg-muted px-2.5 py-1 text-xs text-foreground hover:bg-brand-muted hover:text-brand"
                          >
                            {f.labelTitle}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="text-muted-foreground">
                      {nf.format(total)} products
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-brand">
                      Compare
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Featured & verified ---------------------------------------- */}
        <section>
          <SectionHead
            title="Featured & verified"
            subtitle="Top-rated products from licence-checked providers. Sponsored placements are always labelled."
            href="/ng/personal-loans"
            linkText="See all loans"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <Disclaimer className="mt-4" />
        </section>

        {/* ---- By country ------------------------------------------------- */}
        <section>
          <SectionHead
            title="Browse by country"
            subtitle="Localised comparisons with country-specific licensing and currency."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => {
              const famsHere = Array.from(
                new Map(
                  hubs
                    .filter((h) => h.country.code === c.code)
                    .map((h) => [h.family.slug, h.family]),
                ).values(),
              );
              const first = hubs.find((h) => h.country.code === c.code)!;
              return (
                <Link
                  key={c.code}
                  href={hubHref(c.code, first.family.slug)}
                  className="group flex items-center justify-between rounded-2xl border border-border p-5 transition-colors hover:border-brand/60"
                >
                  <div>
                    <div className="font-semibold group-hover:text-brand">
                      {c.name}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {nf.format(countryCount(c.code))} products ·{" "}
                      {famsHere.length} categor
                      {famsHere.length === 1 ? "y" : "ies"}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---- Tools / calculators ---------------------------------------- */}
        <section>
          <SectionHead
            title="Free calculators"
            subtitle="Run the numbers before you compare — then jump straight to matching products."
            href="/calculators"
            linkText="All calculators"
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CALCULATORS.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:border-brand/60 hover:bg-muted/40"
              >
                <calc.icon className="h-5 w-5 text-brand" />
                <span className="text-xs font-medium leading-tight">
                  {calc.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ---- Why FinanceMonk (E-E-A-T) ---------------------------------- */}
        <section className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
          <SectionHead
            title={`Why ${SITE.name}`}
            subtitle="A directory you can trust for decisions that matter."
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Trust
              icon={<BadgeCheck className="h-5 w-5 text-gold" />}
              title="Licence-checked"
              body="Products from institutions on the CBN, NAICOM, SEC and PenCom registers. The gold badge means licensed and claimed."
            />
            <Trust
              icon={<ScrollText className="h-5 w-5 text-brand" />}
              title="Indicative & dated"
              body="Every figure carries a last-verified date and a clear 'confirm with the provider' note. We never present a rate as final."
            />
            <Trust
              icon={<ShieldCheck className="h-5 w-5 text-brand" />}
              title="Independent"
              body="We compare on the merits. Sponsored placements are always labelled, and methodology is public."
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              Editorial responsibility:{" "}
              <Link href="/about#editor" className="font-medium text-foreground hover:text-brand">
                {SITE.editorial.responsibleName}
              </Link>
              , {SITE.editorial.responsibleTitle}.
            </p>
            <Link href="/methodology" className="font-medium text-brand hover:underline">
              How we compare →
            </Link>
          </div>
        </section>

        {/* ---- Popular comparisons (SEO link-mesh) ------------------------ */}
        <section>
          <SectionHead title="Popular comparisons" />
          <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((h) => (
              <li key={`${h.country.code}-${h.family.slug}`}>
                <Link
                  href={hubHref(h.country.code, h.family.slug)}
                  className="text-muted-foreground hover:text-brand hover:underline"
                >
                  Best {h.family.label} in {h.country.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

// ---- Local presentational helpers -----------------------------------------

function Stat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-background px-4 py-5 text-center sm:py-6">
      <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {sub ?? label}
      </div>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
  href,
  linkText,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href && linkText ? (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline sm:inline-flex"
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function Trust({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-semibold">{title}</div>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
