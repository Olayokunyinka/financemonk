import { Info, Clock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { freshnessOf } from "@/lib/freshness";

// HARD GUARDRAIL: every product and every comparison row must show this
// "indicative — confirm with provider" disclaimer together with the
// last-verified date. This component is the single implementation so it can
// never be omitted by accident. Staleness uses the shared freshness rules (M7).

export function LastVerified({
  date,
  className = "",
}: {
  date: Date | string;
  className?: string;
}) {
  const { status, days } = freshnessOf(date);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        status === "stale" ? "text-gold" : "text-muted-foreground"
      } ${className}`}
      title={
        status === "stale"
          ? `Last checked ${days} days ago — we are re-checking these figures.`
          : `Date these figures were last checked (${days} days ago).`
      }
    >
      <Clock className="h-3 w-3" aria-hidden />
      Last verified: {formatDate(date)}
      {status === "stale" ? " (re-checking)" : ""}
    </span>
  );
}

export function Disclaimer({
  lastVerifiedAt,
  className = "",
}: {
  lastVerifiedAt?: Date | string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <Info className="h-3.5 w-3.5" aria-hidden />
        Indicative only — confirm exact terms with the provider before applying.
      </span>
      {lastVerifiedAt ? <LastVerified date={lastVerifiedAt} /> : null}
    </div>
  );
}
