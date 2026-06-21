import type { Metadata } from "next";
import { ProductType } from "@/generated/prisma/enums";
import { SITE } from "@/lib/site";
import { RemittanceCalculator } from "@/components/remittance-calculator";
import { FamilyResults } from "@/components/family-results";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Remittance cost calculator",
  description:
    "See what a money transfer really costs after fees and FX margin, then compare cheaper transfer providers.",
  alternates: { canonical: "/calculators/remittance-cost" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function num(v: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default async function RemittanceCostPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const amount = num(sp.amount, 200000);
  const feePct = num(sp.feePct, 1.5);
  const fxMargin = num(sp.fxMargin, 2.5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Remittance cost calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: `${SITE.url}/calculators/remittance-cost`,
          offers: { "@type": "Offer", price: 0, priceCurrency: "NGN" },
        }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Remittance cost calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        See what a transfer really costs once the fee and FX margin are added,
        then compare cheaper transfer and remittance providers in Nigeria.
      </p>
      <div className="mt-6">
        <RemittanceCalculator defaults={{ amount, feePct, fxMargin }} />
      </div>
      <FamilyResults
        country="ng"
        productTypes={[
          ProductType.MONEY_TRANSFER,
          ProductType.REMITTANCE,
          ProductType.FX,
        ]}
        heading="Transfer & remittance providers in Nigeria"
      />
    </div>
  );
}
