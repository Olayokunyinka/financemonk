// Display formatting helpers.

export function formatCurrency(
  amount: number | null | undefined,
  currency = "NGN",
): string {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

// Compact money for tight table cells, e.g. ₦5,000,000 -> ₦5m.
export function formatAmountRange(
  min: number | null | undefined,
  max: number | null | undefined,
  symbol = "₦",
): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${symbol}${trim(n / 1_000_000)}m`;
    if (n >= 1_000) return `${symbol}${trim(n / 1_000)}k`;
    return `${symbol}${n}`;
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `from ${fmt(min)}`;
  if (max != null) return `up to ${fmt(max)}`;
  return "—";
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${trim(n)}%`;
}

// Representative APR shown in comparison rows.
export function formatApr(
  aprMin: number | null | undefined,
  aprMax: number | null | undefined,
): string {
  if (aprMin != null && aprMax != null && aprMin !== aprMax)
    return `${trim(aprMin)}–${trim(aprMax)}%`;
  if (aprMin != null) return `${trim(aprMin)}%`;
  if (aprMax != null) return `${trim(aprMax)}%`;
  return "—";
}

export function formatTenure(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min != null && max != null) return `${min}–${max} months`;
  if (max != null) return `up to ${max} months`;
  if (min != null) return `from ${min} months`;
  return "—";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Days since a date — used to flag stale rates in the UI.
export function daysSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export type FeeItem = { label: string; amount?: number; unit?: string; note?: string };

export function formatFee(fee: FeeItem): string {
  if (fee.amount === 0 || fee.amount === undefined) return fee.note ?? fee.label;
  const unit = fee.unit ?? "";
  return `${fee.label}: ${fee.amount}${unit}`;
}

export function feesSummary(fees: unknown): string {
  const arr = Array.isArray(fees) ? (fees as FeeItem[]) : [];
  if (arr.length === 0) return "No fees";
  const hasZeroOnly = arr.every((f) => !f.amount);
  if (hasZeroOnly) return "₦0";
  return arr.map(formatFee).join(" · ");
}
