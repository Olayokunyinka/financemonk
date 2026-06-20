// Use-case landing pages (M17): curated, attribute-filtered SEO pages on top of
// the existing slices (e.g. "no-collateral personal loans", "high-yield
// savings", "loans for SMEs"). Each is a programmatic hub with a UNIQUE intro
// and the same thin-content rule, served at /best/{slug}.

import { ProductType } from "@/generated/prisma/enums";

type PredicateProduct = {
  features: string[];
  interestRate: number | null;
  aprMin: number | null;
  aprMax: number | null;
  minAmount: number | null;
};

export type UseCase = {
  slug: string;
  country: string;
  productType: ProductType;
  title: string;
  intro: string;
  // Filter applied on top of the country+family product set.
  predicate: (p: PredicateProduct) => boolean;
};

const hasFeature = (p: PredicateProduct, needle: string) =>
  p.features.some((f) => f.toLowerCase().includes(needle.toLowerCase()));

export const USE_CASES: UseCase[] = [
  {
    slug: "no-collateral-personal-loans-nigeria",
    country: "ng",
    productType: ProductType.PERSONAL_LOAN,
    title: "No-collateral personal loans in Nigeria (2026)",
    intro:
      "If you don't want to pledge an asset, these are the personal loans in Nigeria that lend without collateral — typically unsecured salary loans, app-based instant loans and bank quick-credit products. Unsecured lending is priced for the extra risk, so the rate and fees matter even more than usual: we convert each product to a comparable annual basis and show the fees alongside. Every lender below is licensed by the Central Bank of Nigeria. Compare the true cost, check the eligibility and required documents, and confirm the exact terms with the provider before applying — figures are indicative and change frequently.",
    predicate: (p) => hasFeature(p, "no collateral"),
  },
  {
    slug: "instant-personal-loans-nigeria",
    country: "ng",
    productType: ProductType.PERSONAL_LOAN,
    title: "Instant personal loans in Nigeria (2026)",
    intro:
      "Need money today? These Nigerian personal loans disburse instantly or within minutes — mostly app-based and USSD loans plus bank quick-credit you can draw without paperwork. Speed usually comes at a price: short-tenure instant loans can carry high effective rates once fees are annualised, so compare the all-in cost, not just how fast the cash arrives. Every provider here is licensed by the Central Bank of Nigeria. Check the amount, tenure and fees, and confirm the exact terms with the provider before applying — figures are indicative and change often.",
    predicate: (p) => hasFeature(p, "instant"),
  },
  {
    slug: "high-yield-savings-nigeria",
    country: "ng",
    productType: ProductType.SAVINGS,
    title: "High-yield savings accounts in Nigeria (2026)",
    intro:
      "These are the higher-interest savings options in Nigeria — typically fixed deposits and target/lock savings that pay more than an everyday account in exchange for less flexibility. With inflation eroding idle cash, the headline rate matters, but so do the conditions: whether the rate is fixed, whether there's a penalty for early withdrawal, and the minimum balance. We show the annual rate next to fees and minimums so you can compare like with like. Every provider is licensed by the Central Bank of Nigeria. Confirm the exact terms with the provider before opening — figures are indicative and change.",
    predicate: (p) => (p.interestRate ?? 0) >= 12,
  },
  {
    slug: "loans-for-smes-nigeria",
    country: "ng",
    productType: ProductType.BUSINESS_LOAN,
    title: "Loans for SMEs in Nigeria (2026)",
    intro:
      "Small and medium businesses in Nigeria can fund cash-flow gaps, equipment and expansion with the loans below — from quick unsecured working-capital facilities to term loans, asset finance and trade finance. The cheapest options are bank SME loans, but they ask for CAC registration, a business account and bank statements; finance companies are faster but pricier. We convert each to a comparable annual basis and show the fees, amounts and tenures side by side. Every lender is licensed by the Central Bank of Nigeria. Confirm the exact terms with the provider before applying — figures are indicative and change.",
    predicate: () => true,
  },
  {
    slug: "low-interest-credit-cards-nigeria",
    country: "ng",
    productType: ProductType.CREDIT_CARD,
    title: "Low-interest credit cards in Nigeria (2026)",
    intro:
      "These Nigerian credit cards carry the lowest purchase APRs — what matters most if you sometimes carry a balance rather than clearing it in full each month. Remember that paying your statement within the interest-free period means you pay no purchase interest at all, so also weigh the annual fee and the length of the interest-free window. We show the purchase APR on a comparable annual basis next to the annual fee and credit limit, for cards from CBN-licensed banks only. Confirm the exact terms with the issuer before applying — figures are indicative and change.",
    predicate: (p) => (p.aprMin ?? 99) <= 26,
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
