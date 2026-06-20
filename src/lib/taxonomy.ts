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
  locale: string; // BCP-47, for Intl formatting + hreflang
  regulator: string; // licence register source of truth
};

export const COUNTRIES: Record<string, Country> = {
  ng: {
    code: "ng",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    locale: "en-NG",
    regulator: "Central Bank of Nigeria",
  },
  ke: {
    code: "ke",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    locale: "en-KE",
    regulator: "Central Bank of Kenya",
  },
  za: {
    code: "za",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    locale: "en-ZA",
    regulator: "Prudential Authority (SARB)",
  },
};

// Convenience lookups (used by the seed script + formatting).
export function currencyOf(countryCode: string): string {
  return COUNTRIES[countryCode]?.currency ?? "NGN";
}

// Locale for a currency code (so formatting is correct without threading the
// country through every call site).
export function localeForCurrency(currency: string): string {
  const c = Object.values(COUNTRIES).find((x) => x.currency === currency);
  return c?.locale ?? "en-NG";
}

// Product "kind" drives rate wording, the product-page illustration, the
// schema.org type and which calculator the family funnels into.
export type FamilyKind =
  | "loan"
  | "deposit"
  | "card"
  | "insurance"
  | "investment"
  | "payments";

export type Family = {
  slug: string; // used in URLs
  type: ProductType;
  // Lowercase plural noun used in sentences ("best {label} in Nigeria").
  label: string;
  // Capitalised for headings.
  labelTitle: string;
  kind: FamilyKind;
};

// All 6 product families and their sub-types. A new sub-type is a data entry
// here + seed; routing/pages are family-agnostic. `kind` drives terms, the
// comparison columns (via src/lib/families), wording, illustration, schema.org
// type and the calculator.
const F = (
  slug: string,
  type: ProductType,
  label: string,
  labelTitle: string,
  kind: FamilyKind,
): Family => ({ slug, type, label, labelTitle, kind });

export const FAMILIES: Record<string, Family> = {
  // Lending
  "personal-loans": F("personal-loans", ProductType.PERSONAL_LOAN, "personal loans", "Personal Loans", "loan"),
  "business-loans": F("business-loans", ProductType.BUSINESS_LOAN, "business loans", "Business Loans", "loan"),
  "payday-loans": F("payday-loans", ProductType.PAYDAY_LOAN, "payday loans", "Payday Loans", "loan"),
  "asset-finance": F("asset-finance", ProductType.ASSET_FINANCE, "asset finance", "Asset Finance", "loan"),
  mortgages: F("mortgages", ProductType.MORTGAGE, "mortgages", "Mortgages", "loan"),
  "trade-finance": F("trade-finance", ProductType.TRADE_FINANCE, "trade finance", "Trade Finance", "loan"),
  // Deposits
  "savings-accounts": F("savings-accounts", ProductType.SAVINGS, "savings accounts", "Savings Accounts", "deposit"),
  "current-accounts": F("current-accounts", ProductType.CURRENT_ACCOUNT, "current accounts", "Current Accounts", "deposit"),
  "fixed-deposits": F("fixed-deposits", ProductType.FIXED_DEPOSIT, "fixed deposits", "Fixed Deposits", "deposit"),
  "domiciliary-accounts": F("domiciliary-accounts", ProductType.DOMICILIARY, "domiciliary accounts", "Domiciliary Accounts", "deposit"),
  // Cards
  "credit-cards": F("credit-cards", ProductType.CREDIT_CARD, "credit cards", "Credit Cards", "card"),
  "debit-cards": F("debit-cards", ProductType.DEBIT_CARD, "debit cards", "Debit Cards", "card"),
  "prepaid-cards": F("prepaid-cards", ProductType.PREPAID_CARD, "prepaid cards", "Prepaid Cards", "card"),
  "virtual-cards": F("virtual-cards", ProductType.VIRTUAL_CARD, "virtual cards", "Virtual Cards", "card"),
  // Insurance
  "health-insurance": F("health-insurance", ProductType.HEALTH_INSURANCE, "health insurance", "Health Insurance", "insurance"),
  "auto-insurance": F("auto-insurance", ProductType.AUTO_INSURANCE, "auto insurance", "Auto Insurance", "insurance"),
  "life-insurance": F("life-insurance", ProductType.LIFE_INSURANCE, "life insurance", "Life Insurance", "insurance"),
  "travel-insurance": F("travel-insurance", ProductType.TRAVEL_INSURANCE, "travel insurance", "Travel Insurance", "insurance"),
  "business-insurance": F("business-insurance", ProductType.BUSINESS_INSURANCE, "business insurance", "Business Insurance", "insurance"),
  "agric-insurance": F("agric-insurance", ProductType.AGRIC_INSURANCE, "agric insurance", "Agric Insurance", "insurance"),
  // Investment
  "mutual-funds": F("mutual-funds", ProductType.MUTUAL_FUND, "mutual funds", "Mutual Funds", "investment"),
  "money-market-funds": F("money-market-funds", ProductType.MONEY_MARKET, "money market funds", "Money Market Funds", "investment"),
  "fixed-income": F("fixed-income", ProductType.FIXED_INCOME, "fixed income", "Fixed Income", "investment"),
  pensions: F("pensions", ProductType.PENSION, "pensions", "Pensions", "investment"),
  // Payments / remittance
  "money-transfer": F("money-transfer", ProductType.MONEY_TRANSFER, "money transfer", "Money Transfer", "payments"),
  fx: F("fx", ProductType.FX, "FX services", "Foreign Exchange", "payments"),
  remittance: F("remittance", ProductType.REMITTANCE, "remittance", "Remittance", "payments"),
};

// The calculator a family funnels into.
export function calculatorFor(family: Family): string {
  switch (family.kind) {
    case "deposit":
      return "/calculators/savings-growth";
    case "card":
      return "/calculators/credit-card-cost";
    case "insurance":
      return "/calculators/insurance-needs";
    case "investment":
      return "/calculators/investment-growth";
    case "payments":
      return "/calculators/remittance-cost";
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
