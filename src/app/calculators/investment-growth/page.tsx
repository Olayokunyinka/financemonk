import type { Metadata } from "next";
import { ProductType } from "@/generated/prisma/enums";
import { SITE } from "@/lib/site";
import { InvestmentCalculator } from "@/components/investment-calculator";
import { FamilyResults } from "@/components/family-results";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Investment growth calculator",
  description:
    "Project how your investment could grow, then compare funds and investment products.",
  alternates: { canonical: "/calculators/investment-growth" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function num(v: string | string[] | undefined, fallback: number): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number((s ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default async function InvestmentGrowthPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const amount = num(sp.amount, 500000);
  const rate = num(sp.rate, 15);
  const years = num(sp.years, 5);
  const monthly = num(sp.monthly, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Investment growth calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: `${SITE.url}/calculators/investment-growth`,
          offers: { "@type": "Offer", price: 0, priceCurrency: "NGN" },
        }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Investment growth calculator
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Project how an investment could grow with compound returns, then compare
        funds and investment products in Nigeria.
      </p>
      <div className="mt-6">
        <InvestmentCalculator defaults={{ amount, rate, years, monthly }} />
      </div>
      <FamilyResults
        country="ng"
        productTypes={[
          ProductType.MUTUAL_FUND,
          ProductType.MONEY_MARKET,
          ProductType.FIXED_INCOME,
          ProductType.PENSION,
        ]}
        heading="Investment products in Nigeria"
      />
    </div>
  );
}
