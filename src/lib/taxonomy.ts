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

// All 54 African countries. Registering a country here makes the engine ready
// for it; public pages only appear once a slice has real data (thin-content
// rule), so empty countries create no thin pages. `regulator` is the headline
// central bank — VERIFY the correct per-product regulator (insurance/securities
// often differ) and currency before launching a given country (see
// COUNTRY-LAUNCH.md).
const C = (
  code: string,
  name: string,
  currency: string,
  currencySymbol: string,
  regulator: string,
): Country => ({ code, name, currency, currencySymbol, locale: `en-${code.toUpperCase()}`, regulator });

export const COUNTRIES: Record<string, Country> = {
  dz: C("dz", "Algeria", "DZD", "دج", "Bank of Algeria"),
  ao: C("ao", "Angola", "AOA", "Kz", "Banco Nacional de Angola"),
  bj: C("bj", "Benin", "XOF", "CFA", "BCEAO"),
  bw: C("bw", "Botswana", "BWP", "P", "Bank of Botswana"),
  bf: C("bf", "Burkina Faso", "XOF", "CFA", "BCEAO"),
  bi: C("bi", "Burundi", "BIF", "FBu", "Bank of the Republic of Burundi"),
  cv: C("cv", "Cabo Verde", "CVE", "$", "Banco de Cabo Verde"),
  cm: C("cm", "Cameroon", "XAF", "FCFA", "BEAC"),
  cf: C("cf", "Central African Republic", "XAF", "FCFA", "BEAC"),
  td: C("td", "Chad", "XAF", "FCFA", "BEAC"),
  km: C("km", "Comoros", "KMF", "CF", "Central Bank of the Comoros"),
  cg: C("cg", "Congo (Republic)", "XAF", "FCFA", "BEAC"),
  cd: C("cd", "DR Congo", "CDF", "FC", "Central Bank of the Congo"),
  ci: C("ci", "Côte d'Ivoire", "XOF", "CFA", "BCEAO"),
  dj: C("dj", "Djibouti", "DJF", "Fdj", "Central Bank of Djibouti"),
  eg: C("eg", "Egypt", "EGP", "E£", "Central Bank of Egypt"),
  gq: C("gq", "Equatorial Guinea", "XAF", "FCFA", "BEAC"),
  er: C("er", "Eritrea", "ERN", "Nfk", "Bank of Eritrea"),
  sz: C("sz", "Eswatini", "SZL", "E", "Central Bank of Eswatini"),
  et: C("et", "Ethiopia", "ETB", "Br", "National Bank of Ethiopia"),
  ga: C("ga", "Gabon", "XAF", "FCFA", "BEAC"),
  gm: C("gm", "Gambia", "GMD", "D", "Central Bank of The Gambia"),
  gh: C("gh", "Ghana", "GHS", "GH₵", "Bank of Ghana"),
  gn: C("gn", "Guinea", "GNF", "FG", "Central Bank of the Republic of Guinea"),
  gw: C("gw", "Guinea-Bissau", "XOF", "CFA", "BCEAO"),
  ke: C("ke", "Kenya", "KES", "KSh", "Central Bank of Kenya"),
  ls: C("ls", "Lesotho", "LSL", "L", "Central Bank of Lesotho"),
  lr: C("lr", "Liberia", "LRD", "L$", "Central Bank of Liberia"),
  ly: C("ly", "Libya", "LYD", "ل.د", "Central Bank of Libya"),
  mg: C("mg", "Madagascar", "MGA", "Ar", "Central Bank of Madagascar"),
  mw: C("mw", "Malawi", "MWK", "MK", "Reserve Bank of Malawi"),
  ml: C("ml", "Mali", "XOF", "CFA", "BCEAO"),
  mr: C("mr", "Mauritania", "MRU", "UM", "Central Bank of Mauritania"),
  mu: C("mu", "Mauritius", "MUR", "₨", "Bank of Mauritius"),
  ma: C("ma", "Morocco", "MAD", "DH", "Bank Al-Maghrib"),
  mz: C("mz", "Mozambique", "MZN", "MT", "Bank of Mozambique"),
  na: C("na", "Namibia", "NAD", "N$", "Bank of Namibia"),
  ne: C("ne", "Niger", "XOF", "CFA", "BCEAO"),
  ng: C("ng", "Nigeria", "NGN", "₦", "Central Bank of Nigeria"),
  rw: C("rw", "Rwanda", "RWF", "FRw", "National Bank of Rwanda"),
  st: C("st", "São Tomé and Príncipe", "STN", "Db", "Central Bank of São Tomé and Príncipe"),
  sn: C("sn", "Senegal", "XOF", "CFA", "BCEAO"),
  sc: C("sc", "Seychelles", "SCR", "₨", "Central Bank of Seychelles"),
  sl: C("sl", "Sierra Leone", "SLE", "Le", "Bank of Sierra Leone"),
  so: C("so", "Somalia", "SOS", "Sh", "Central Bank of Somalia"),
  za: C("za", "South Africa", "ZAR", "R", "Prudential Authority (SARB)"),
  ss: C("ss", "South Sudan", "SSP", "£", "Bank of South Sudan"),
  sd: C("sd", "Sudan", "SDG", "ج.س", "Central Bank of Sudan"),
  tz: C("tz", "Tanzania", "TZS", "TSh", "Bank of Tanzania"),
  tg: C("tg", "Togo", "XOF", "CFA", "BCEAO"),
  tn: C("tn", "Tunisia", "TND", "DT", "Central Bank of Tunisia"),
  ug: C("ug", "Uganda", "UGX", "USh", "Bank of Uganda"),
  zm: C("zm", "Zambia", "ZMW", "ZK", "Bank of Zambia"),
  zw: C("zw", "Zimbabwe", "ZWG", "Z$", "Reserve Bank of Zimbabwe"),
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
