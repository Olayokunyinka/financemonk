// Country and product-family taxonomy.
//
// This is the single place that maps URL slugs (e.g. "ng" / "personal-loans")
// to database values and human labels. Adding a new country or product family
// later is a data change here + seed data — NO routing/page code changes.

import { ProductType } from "@/generated/prisma/enums";

export type Country = {
  code: string; // ISO-2 lowercase, used in URLs
  name: string;
  currency: string; // ISO currency code
  currencySymbol: string;
  regulator: string; // licence register source of truth
};

export const COUNTRIES: Record<string, Country> = {
  ng: {
    code: "ng",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    regulator: "Central Bank of Nigeria",
  },
  ke: {
    code: "ke",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    regulator: "Central Bank of Kenya",
  },
  za: {
    code: "za",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    regulator: "Prudential Authority (SARB)",
  },
};

// Convenience: currency lookup by country code (used by the seed script).
export function currencyOf(countryCode: string): string {
  return COUNTRIES[countryCode]?.currency ?? "NGN";
}

// Product "kind" drives rate wording, the product-page illustration, the
// schema.org type and which calculator the family funnels into.
export type FamilyKind = "loan" | "deposit" | "card";

export type Family = {
  slug: string; // used in URLs
  type: ProductType;
  // Lowercase plural noun used in sentences ("best {label} in Nigeria").
  label: string;
  // Capitalised for headings.
  labelTitle: string;
  kind: FamilyKind;
};

export const FAMILIES: Record<string, Family> = {
  "personal-loans": {
    slug: "personal-loans",
    type: ProductType.PERSONAL_LOAN,
    label: "personal loans",
    labelTitle: "Personal Loans",
    kind: "loan",
  },
  "savings-accounts": {
    slug: "savings-accounts",
    type: ProductType.SAVINGS,
    label: "savings accounts",
    labelTitle: "Savings Accounts",
    kind: "deposit",
  },
  "business-loans": {
    slug: "business-loans",
    type: ProductType.BUSINESS_LOAN,
    label: "business loans",
    labelTitle: "Business Loans",
    kind: "loan",
  },
  "credit-cards": {
    slug: "credit-cards",
    type: ProductType.CREDIT_CARD,
    label: "credit cards",
    labelTitle: "Credit Cards",
    kind: "card",
  },
};

// The calculator a family funnels into.
export function calculatorFor(family: Family): string {
  switch (family.kind) {
    case "deposit":
      return "/calculators/savings-growth";
    case "card":
      return "/calculators/credit-card-cost";
    case "loan":
    default:
      return "/calculators/loan-repayment";
  }
}

export function getCountry(code: string): Country | undefined {
  return COUNTRIES[code.toLowerCase()];
}

export function getFamily(slug: string): Family | undefined {
  return FAMILIES[slug.toLowerCase()];
}

export function familyByType(type: ProductType): Family | undefined {
  return Object.values(FAMILIES).find((f) => f.type === type);
}

// All published country × family combinations — drives generateStaticParams
// and the sitemap.
export function allHubParams(): { country: string; family: string }[] {
  const params: { country: string; family: string }[] = [];
  for (const c of Object.values(COUNTRIES)) {
    for (const f of Object.values(FAMILIES)) {
      params.push({ country: c.code, family: f.slug });
    }
  }
  return params;
}

export function hubHref(countryCode: string, familySlug: string): string {
  return `/${countryCode}/${familySlug}`;
}
