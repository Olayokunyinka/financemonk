// Validate + clean a raw draft from an adapter before staging. Returns the
// cleaned draft plus any human-readable issues for the QA reviewer.
import type { RawProductDraft } from "./adapters/types";

export function normalizeDraft(raw: RawProductDraft): {
  value: RawProductDraft;
  issues: string[];
} {
  const issues: string[] = [];
  const v: RawProductDraft = { ...raw };

  if (!v.providerSlug) issues.push("Missing providerSlug");
  if (!v.slug) issues.push("Missing product slug");
  if (!v.name) issues.push("Missing product name");

  // Rate sanity (loans). Swap if min > max; flag implausible values.
  if (v.aprMin != null && v.aprMax != null && v.aprMin > v.aprMax) {
    [v.aprMin, v.aprMax] = [v.aprMax, v.aprMin];
    issues.push("Interest min/max were swapped");
  }
  for (const r of [v.aprMin, v.aprMax, v.interestRate]) {
    if (r != null && (r < 0 || r > 1000)) issues.push(`Implausible rate: ${r}%`);
  }

  // Amount sanity.
  if (v.minAmount != null && v.maxAmount != null && v.minAmount > v.maxAmount) {
    [v.minAmount, v.maxAmount] = [v.maxAmount, v.minAmount];
    issues.push("Amount min/max were swapped");
  }
  if (
    v.aprMin == null &&
    v.aprMax == null &&
    v.interestRate == null
  ) {
    issues.push("No rate found (interest/APR)");
  }

  return { value: v, issues };
}
