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
  /**
   * Figures are indicative (scraped market/benchmark data, not a contractual
   * quote). normalizeDraft() turns this into a QA issue so the reviewer in
   * /admin/ingestion sees it before anything is published. Always true for the
   * live adapters here — scraped rates change and must be re-verified.
   */
  indicative?: boolean;
  /** Source attribution shown to the QA reviewer, e.g. "CBN money market indicators". */
  sourceLabel?: string;
  /** ISO date the figures were fetched/verified (carried into the INDICATIVE issue). */
  lastVerifiedAt?: string;
};

/**
 * Per-source legal/ToS posture. We never fetch a live source until a human has
 * confirmed its terms allow it (mirrors the CPA_ENABLED gate elsewhere):
 *   - "approved"       — ToS + robots.txt checked; --live may fetch.
 *   - "pending-review" — implemented but NOT cleared; --live falls back to the
 *                        offline fixture and logs a warning.
 *   - "blocked"        — source forbids automated access; never fetch live.
 */
export type ToSStatus = "approved" | "pending-review" | "blocked";

export type SourceToS = {
  status: ToSStatus;
  /** ISO date a human last reviewed the source's terms. */
  checkedAt: string;
  /** Short note on what was checked / why this status (shown in logs). */
  notes: string;
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
  /** Legal/ToS posture of the live source — gates --live (see SourceToS). */
  tos: SourceToS;
  /**
   * Produce drafts. Offline (default) reads bundled fixtures; live fetches the
   * real source (respecting robots.txt + rate limits, and only if tos.status
   * === "approved").
   */
  run(opts: { live: boolean }): Promise<RawProductDraft[]>;
}
