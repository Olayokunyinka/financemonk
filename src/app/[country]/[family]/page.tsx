import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, getFamily, calculatorFor } from "@/lib/taxonomy";
import { USE_CASES } from "@/lib/usecases";
import {
  getHub,
  getHubProducts,
  hubIsIndexable,
  listHubs,
} from "@/lib/queries";
import { toRow } from "@/lib/rows";
import { HUB_MIN_PRODUCTS } from "@/lib/site";
import {
  faqJsonLd,
  hubItemListJsonLd,
  breadcrumbJsonLd,
  hubTitleFor,
  type FaqItem,
} from "@/lib/jsonld";
import { ComparisonTable } from "@/components/comparison-table";
import { Faq } from "@/components/faq";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Disclaimer } from "@/components/disclaimer";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 3600; // ISR

// Statically generate every published hub (those with editorial content).
export async function generateStaticParams() {
  const hubs = await listHubs();
  return hubs.map((h) => ({ country: h.country.code, family: h.family.slug }));
}

type Params = Promise<{ country: string; family: string }>;

async function resolve(params: Params) {
  const { country: countryCode, family: familySlug } = await params;
  const country = getCountry(countryCode);
  const family = getFamily(familySlug);
  if (!country || !family) return null;
  const hub = await getHub(country.code, family.type);
  const products = await getHubProducts(country.code, family.type);
  return { country, family, hub, products };
}

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const data = await resolve(props.params);
  if (!data) return {};
  const { country, family, hub, products } = data;
  const title = hub?.title ?? hubTitleFor(country, family);
  const indexable = hubIsIndexable(hub, products.length);

  // hreflang: link the same family across the countries that publish it, so
  // Google understands the per-country variants (i18n/geo scaffolding).
  const sameFamily = (await listHubs()).filter(
    (h) => h.family.slug === family.slug,
  );
  const languages: Record<string, string> = {};
  for (const h of sameFamily) {
    languages[h.country.locale] = `/${h.country.code}/${h.family.slug}`;
  }

  return {
    title,
    description: `Compare ${products.length} ${family.label} in ${country.name} by interest rate, fees, amount and customer rating. Indicative terms, last-verified dates and licence-checked providers.`,
    alternates: {
      canonical: `/${country.code}/${family.slug}`,
      ...(Object.keys(languages).length > 1 ? { languages } : {}),
    },
    // THIN-CONTENT RULE: pages below threshold or without a unique intro are
    // marked noindex so we never pollute the index with empty hubs.
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function HubPage(props: { params: Params }) {
  const data = await resolve(props.params);
  if (!data) notFound();
  const { country, family, hub, products } = data;

  const title = hub?.title ?? hubTitleFor(country, family);
  const rows = products.map(toRow);
  const faq = (hub?.faq as FaqItem[] | undefined) ?? [];
  const related =
    (hub?.relatedSlugs as { label: string; href: string }[] | undefined) ?? [];
  const indexable = hubIsIndexable(hub, products.length);
  const useCases = USE_CASES.filter(
    (u) => u.country === country.code && u.productType === family.type,
  );

  const crumbs = [
    { name: "Home", href: "/" },
    { name: country.name, href: `/${country.code}/${family.slug}` },
    { name: family.labelTitle, href: `/${country.code}/${family.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          hubItemListJsonLd(products, title),
          faqJsonLd(faq),
        ]}
      />

      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>

      {/* Unique editorial intro (required for indexing). */}
      {hub?.intro ? (
        <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
          {hub.intro}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/methodology" className="text-brand hover:underline">
          How we compare →
        </Link>
        <Link
          href={
            family.kind === "deposit"
              ? `${calculatorFor(family)}?country=${country.code}`
              : calculatorFor(family)
          }
          className="text-brand hover:underline"
        >
          {family.kind === "deposit"
            ? "Savings growth calculator →"
            : family.kind === "card"
              ? "Credit-card cost calculator →"
              : "Loan repayment calculator →"}
        </Link>
      </div>

      {!indexable ? (
        <div className="mt-4 rounded-lg border border-dashed border-gold bg-gold-bg/40 px-3 py-2 text-xs text-gold">
          Editorial note (not shown to the public reason): this hub currently has{" "}
          {products.length} live product(s); it is marked{" "}
          <strong>noindex</strong> until it has at least {HUB_MIN_PRODUCTS} and a
          unique intro (thin-content rule).
        </div>
      ) : null}

      {/* Comparison table (F1). */}
      <div className="mt-8">
        {rows.length > 0 ? (
          <ComparisonTable rows={rows} />
        ) : (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            No live products yet for this comparison.
          </p>
        )}
      </div>

      <Disclaimer className="mt-4" />

      {/* FAQ (schema.org FAQPage). */}
      {faq.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4">
            <Faq items={faq} />
          </div>
        </section>
      ) : null}

      {/* Related links (internal-linking mesh). */}
      {/* Use-case landing pages for this slice (internal-link mesh). */}
      {useCases.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Popular searches</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {useCases.map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/best/${u.slug}`}
                  className="rounded-full border border-border px-3 py-1 hover:border-brand hover:text-brand"
                >
                  {u.title.replace(/ \(2026\)$/, "")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="rounded-full border border-border px-3 py-1 hover:border-brand hover:text-brand"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
