// Per-family field registry. Each product family (by `kind`) declares the
// comparable metrics that drive the comparison-table columns + the product-page
// terms, plus its schema.org type. Loan/deposit/card map to the existing scalar
// columns; insurance/investment/payments read family-specific fields from
// Product.terms (Json). A hub is always a single family, so all rows in a table
// share the same metric labels.

import {
  formatApr,
  formatPercent,
  feesSummary,
  formatAmountRange,
  formatTenure,
  formatCurrency,
  currencySymbol,
} from "@/lib/format";
import type { FamilyKind } from "@/lib/taxonomy";
import { ProductType } from "@/generated/prisma/enums";

// The product shape a metric reads from (scalar columns + terms JSON).
export type MetricProduct = {
  aprMin: number | null;
  aprMax: number | null;
  interestRate: number | null;
  fees: unknown;
  minAmount: number | null;
  maxAmount: number | null;
  minTenureMonths: number | null;
  maxTenureMonths: number | null;
  currency: string;
  terms: unknown;
};

export type Metric = { label: string; get: (p: MetricProduct) => string };

// ---- term value formatters ------------------------------------------------
function terms(p: MetricProduct): Record<string, unknown> {
  return p.terms && typeof p.terms === "object"
    ? (p.terms as Record<string, unknown>)
    : {};
}
const money = (p: MetricProduct, key: string): string => {
  const v = terms(p)[key];
  return typeof v === "number" ? formatCurrency(v, p.currency) : "—";
};
const pct = (v: unknown): string => (typeof v === "number" ? `${v}%` : "—");
const text = (v: unknown): string =>
  typeof v === "string" && v.trim() ? v : "—";

// ---- per-kind metrics (≤4; shown as table columns + product term rows) ----
export const FAMILY_METRICS: Record<FamilyKind, Metric[]> = {
  loan: [
    { label: "Interest (p.a.)", get: (p) => formatApr(p.aprMin, p.aprMax) },
    { label: "Fees", get: (p) => feesSummary(p.fees) },
    {
      label: "Amount",
      get: (p) =>
        formatAmountRange(p.minAmount, p.maxAmount, currencySymbol(p.currency)),
    },
    {
      label: "Tenure",
      get: (p) => formatTenure(p.minTenureMonths, p.maxTenureMonths),
    },
  ],
  deposit: [
    { label: "Interest (p.a.)", get: (p) => formatPercent(p.interestRate) },
    { label: "Fees", get: (p) => feesSummary(p.fees) },
    {
      label: "Min. balance",
      get: (p) =>
        formatAmountRange(p.minAmount, p.maxAmount, currencySymbol(p.currency)),
    },
  ],
  card: [
    { label: "Purchase APR", get: (p) => formatApr(p.aprMin, p.aprMax) },
    { label: "Fees", get: (p) => feesSummary(p.fees) },
    {
      label: "Credit limit",
      get: (p) =>
        formatAmountRange(p.minAmount, p.maxAmount, currencySymbol(p.currency)),
    },
  ],
  insurance: [
    { label: "Premium from", get: (p) => money(p, "premiumFrom") },
    { label: "Cover", get: (p) => money(p, "sumAssured") },
    { label: "Claims paid", get: (p) => pct(terms(p).claimRatio) },
    { label: "Excess", get: (p) => money(p, "excess") },
  ],
  investment: [
    {
      label: "Return (p.a.)",
      get: (p) => pct(terms(p).returnPa ?? p.interestRate ?? undefined),
    },
    { label: "Risk", get: (p) => text(terms(p).risk) },
    {
      label: "Min. investment",
      get: (p) =>
        typeof terms(p).minInvestment === "number"
          ? formatCurrency(terms(p).minInvestment as number, p.currency)
          : formatAmountRange(p.minAmount, p.maxAmount, currencySymbol(p.currency)),
    },
    { label: "Mgmt fee", get: (p) => pct(terms(p).mgmtFee) },
  ],
  payments: [
    { label: "Transfer fee", get: (p) => text(terms(p).transferFee) },
    { label: "FX margin", get: (p) => pct(terms(p).fxMargin) },
    { label: "Speed", get: (p) => text(terms(p).speed) },
    { label: "Corridors", get: (p) => text(terms(p).corridors) },
  ],
};

// schema.org @type per kind.
export function schemaTypeFor(kind: FamilyKind): string {
  switch (kind) {
    case "card":
      return "CreditCard";
    case "loan":
      return "LoanOrCredit";
    case "investment":
      return "InvestmentOrDeposit";
    case "deposit":
    case "insurance":
    case "payments":
    default:
      return "FinancialProduct";
  }
}

// Direct ProductType -> kind map (independent of the FAMILIES taxonomy so it's
// always complete).
export const KIND_BY_TYPE: Record<string, FamilyKind> = {
  PERSONAL_LOAN: "loan",
  BUSINESS_LOAN: "loan",
  PAYDAY_LOAN: "loan",
  ASSET_FINANCE: "loan",
  MORTGAGE: "loan",
  TRADE_FINANCE: "loan",
  SAVINGS: "deposit",
  CURRENT_ACCOUNT: "deposit",
  FIXED_DEPOSIT: "deposit",
  DOMICILIARY: "deposit",
  CREDIT_CARD: "card",
  DEBIT_CARD: "card",
  PREPAID_CARD: "card",
  VIRTUAL_CARD: "card",
  HEALTH_INSURANCE: "insurance",
  AUTO_INSURANCE: "insurance",
  LIFE_INSURANCE: "insurance",
  TRAVEL_INSURANCE: "insurance",
  BUSINESS_INSURANCE: "insurance",
  AGRIC_INSURANCE: "insurance",
  MUTUAL_FUND: "investment",
  MONEY_MARKET: "investment",
  FIXED_INCOME: "investment",
  PENSION: "investment",
  MONEY_TRANSFER: "payments",
  FX: "payments",
  REMITTANCE: "payments",
  OTHER: "loan",
};

export function kindOfType(productType: ProductType | string): FamilyKind {
  return KIND_BY_TYPE[productType as string] ?? "loan";
}

// Build label/value metric pairs for a product (used by the table + product page).
export function buildMetrics(
  kind: FamilyKind,
  product: MetricProduct,
): { label: string; value: string }[] {
  return FAMILY_METRICS[kind].map((m) => ({ label: m.label, value: m.get(product) }));
}
