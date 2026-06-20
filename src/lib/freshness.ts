// Rate-freshness rules (M7). A product's comparable terms carry one
// `lastVerifiedAt` (the terms block is verified as a set on ingest / provider
// "confirm current"). This module turns that date into a fresh/aging/stale
// status used by the UI flags and the admin freshness dashboard.
//
// Thresholds are constants (optionally overridable via NEXT_PUBLIC_* so client
// and server agree) since this runs in both server and client components.

import { daysSince } from "@/lib/format";

export const AGING_AFTER_DAYS = Number(
  process.env.NEXT_PUBLIC_AGING_AFTER_DAYS ?? "45",
);
export const STALE_AFTER_DAYS = Number(
  process.env.NEXT_PUBLIC_STALE_AFTER_DAYS ?? "90",
);

export type Freshness = "fresh" | "aging" | "stale";

export function freshnessOf(date: Date | string): {
  status: Freshness;
  days: number;
} {
  const days = daysSince(date);
  const status: Freshness =
    days > STALE_AFTER_DAYS ? "stale" : days > AGING_AFTER_DAYS ? "aging" : "fresh";
  return { status, days };
}

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  fresh: "Fresh",
  aging: "Ageing",
  stale: "Stale",
};
