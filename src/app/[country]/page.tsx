import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCountry, hubHref } from "@/lib/taxonomy";
import { listHubs } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 3600;

// Static-generate a landing page per country that has published hubs.
export async function generateStaticParams() {
  const hubs = await listHubs();
  const codes = Array.from(new Set(hubs.map((h) => h.country.code)));
  return codes.map((country) => ({ country }));
}

type Params = Promise<{ country: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { country: code } = await props.params;
  const country = getCountry(code);
  if (!country) return {};
  return {
    title: `Compare financial products in ${country.name} (2026)`,
    description: `Compare loans, savings accounts, credit cards and more in ${country.name} — licence-checked providers, indicative rates and last-verified dates.`,
    alternates: { canonical: `/${country.code}` },
  };
}

export default async function CountryPage(props: { params: Params }) {
  const { country: code } = await props.params;
  const country = getCountry(code);
  if (!country) notFound();

  const hubs = (await listHubs()).filter((h) => h.country.code === country.code);
  if (hubs.length === 0) notFound();

  const crumbs = [
    { name: "Home", href: "/" },
    { name: country.name, href: `/${country.code}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Compare financial products in {country.name}
      </h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Independent, structured comparison of financial products in{" "}
        {country.name} — {country.currency} pricing, licence-checked providers
        (verified against the {country.regulator}), indicative rates and a
        last-verified date on every figure. Pick a category to start.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {hubs.map((h) => (
          <Link key={h.family.slug} href={hubHref(country.code, h.family.slug)}>
            <Card className="h-full transition-colors hover:border-brand">
              <CardContent>
                <div className="font-semibold">{h.family.labelTitle}</div>
                <p className="mt-1 text-sm text-muted-foreground">{h.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm">
        <Link href="/methodology" className="text-brand hover:underline">
          How {SITE.name} compares →
        </Link>
      </p>
    </div>
  );
}
