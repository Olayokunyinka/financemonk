// Ingestion adapter contract. Each provider source implements one Adapter that
// returns normalised-ish product drafts; the pipeline (ingestion/run.ts) handles
// validation, diffing against live data and writing to the QA staging table.

export type FeeItem = { label: string; amount?: number; unit?: string; note?: string };

export type RawProductDraft = {
  providerSlug: string;
  slug: string;
  name: string;
  summary?: string;
  aprMin?: number | null;
  aprMax?: number | null;
  interestRate?: number | null;
  fees?: FeeItem[];
  minAmount?: number | null;
  maxAmount?: number | null;
  minTenureMonths?: number | null;
  maxTenureMonths?: number | null;
  eligibility?: string[];
  requiredDocs?: string[];
  features?: string[];
  sourceUrl?: string;
};

export type ProductFamily =
  | "PERSONAL_LOAN"
  | "BUSINESS_LOAN"
  | "SAVINGS"
  | "CREDIT_CARD";

export interface Adapter {
  /** Stable id, e.g. "example-bank". */
  id: string;
  /** Provider this adapter feeds (must exist as a Provider). */
  providerSlug: string;
  /** ISO-2 country code. */
  country: string;
  /** Product family for the drafts this adapter emits. */
  productType: ProductFamily;
  /** Human label for logs/QA UI. */
  label: string;
  /**
   * Produce drafts. Offline (default) reads bundled fixtures; live fetches the
   * real source (respecting robots.txt).
   */
  run(opts: { live: boolean }): Promise<RawProductDraft[]>;
}
