import type { Metadata } from "next";
import { ProductType } from "@/generated/prisma/enums";
import { SITE } from "@/lib/site";
import { InsuranceNeedsCalculator } from "@/components/insurance-calculator";
import { FamilyResults } from "@/components/family-results";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Insurance needs calculator",
  description:
    "Estimate how much life cover you need, then compare insurance providers.",
  alternates: { canonical: "/calculators/insurance-needs" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function num(v: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default async function InsuranceNeedsPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const income = num(sp.income, 5000000);
  const years = num(sp.years, 10);
  const debts = num(sp.debts, 2000000);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Insurance needs calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: `${SITE.url}/calculators/insurance-needs`,
          offers: { "@type": "Offer", price: 0, priceCurrency: "NGN" },
        }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Insurance needs calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Estimate the life cover that would replace your income and clear your
        debts, then compare insurance providers in Nigeria.
      </p>
      <div className="mt-6">
        <InsuranceNeedsCalculator defaults={{ income, years, debts }} />
      </div>
      <FamilyResults
        country="ng"
        productTypes={[
          ProductType.LIFE_INSURANCE,
          ProductType.HEALTH_INSURANCE,
          ProductType.AUTO_INSURANCE,
          ProductType.TRAVEL_INSURANCE,
          ProductType.BUSINESS_INSURANCE,
          ProductType.AGRIC_INSURANCE,
        ]}
        heading="Insurance providers in Nigeria"
      />
    </div>
  );
}
