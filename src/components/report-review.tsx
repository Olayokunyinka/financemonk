"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { reportReview } from "@/app/actions/report";

const REASONS = [
  "Fake or incentivised",
  "Offensive or abusive",
  "Not about this product",
  "Contains personal data",
  "Other",
];

// Small client widget to report a published review (notice-and-takedown). Calls
// the server action and shows an inline confirmation — no navigation, so the
// product page stays statically generated.
export function ReportReview({ reviewId }: { reviewId: string }) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (done) {
    return (
      <span className="text-xs text-muted-foreground">
        Reported — thanks, we&apos;ll review it.
      </span>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    await reportReview(
      reviewId,
      String(fd.get("reason") ?? "Other"),
      String(fd.get("detail") ?? ""),
    );
    setDone(true);
  }

  return (
    <details className="text-xs text-muted-foreground">
      <summary className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground">
        <Flag className="h-3 w-3" /> Report
      </summary>
      <form onSubmit={onSubmit} className="mt-2 space-y-2">
        <select
          name="reason"
          className="h-8 w-full rounded-md border border-border bg-background px-2"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          name="detail"
          placeholder="Optional detail"
          className="h-8 w-full rounded-md border border-border bg-background px-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md border border-border px-2 py-1 hover:bg-muted disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit report"}
        </button>
      </form>
    </details>
  );
}
