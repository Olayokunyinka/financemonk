import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUseCase, USE_CASES } from "@/lib/usecases";
import { getCountry, familyByType, calculatorFor } from "@/lib/taxonomy";
import { getHubProducts, hubIsIndexable } from "@/lib/queries";
import { toRow } from "@/lib/rows";
import { HUB_MIN_PRODUCTS } from "@/lib/site";
import {
  hubItemListJsonLd,
  breadcrumbJsonLd,
} from "@/lib/jsonld";
import { ComparisonTable } from "@/components/comparison-table";
import { ByLine } from "@/components/byline";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Disclaimer } from "@/components/disclaimer";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const uc = getUseCase(slug);
  if (!uc) return {};
  const all = await getHubProducts(uc.country, uc.productType);
  const count = all.filter(uc.predicate).length;
  return {
    title: uc.title,
    description: uc.intro.slice(0, 155),
    alternates: { canonical: `/best/${uc.slug}` },
    robots: hubIsIndexable({ intro: uc.intro }, count)
      ? undefined
      : { index: false, follow: true },
  };
}

export default async function UseCasePage(props: { params: Params }) {
  const { slug } = await props.params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const country = getCountry(uc.country);
  const family = familyByType(uc.productType);
  if (!country || !family) notFound();

  const all = await getHubProducts(uc.country, uc.productType);
  const products = all.filter(uc.predicate);
  const rows = products.map(toRow);
  const indexable = hubIsIndexable({ intro: uc.intro }, products.length);

  const hubHref = `/${country.code}/${family.slug}`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: country.name, href: `/${country.code}` },
    { name: family.labelTitle, href: hubHref },
    { name: uc.title, href: `/best/${uc.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          hubItemListJsonLd(products, uc.title),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {uc.title}
      </h1>
      <ByLine className="mt-3" />
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
        {uc.intro}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Link href={hubHref} className="text-brand hover:underline">
          All {family.label} in {country.name} →
        </Link>
        <Link href={calculatorFor(family)} className="text-brand hover:underline">
          Calculator →
        </Link>
      </div>

      {!indexable ? (
        <div className="mt-4 rounded-lg border border-dashed border-gold bg-gold-bg/40 px-3 py-2 text-xs text-gold">
          Editorial note: {products.length} matching product(s) — marked{" "}
          <strong>noindex</strong> until there are at least {HUB_MIN_PRODUCTS}
          {" "}(thin-content rule).
        </div>
      ) : null}

      <div className="mt-8">
        {rows.length > 0 ? (
          <ComparisonTable rows={rows} />
        ) : (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            No matching products right now.{" "}
            <Link href={hubHref} className="text-brand hover:underline">
              See all {family.label}
            </Link>
            .
          </p>
        )}
      </div>

      <Disclaimer className="mt-4" />
    </div>
  );
}
