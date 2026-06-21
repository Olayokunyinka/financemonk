import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `${SITE.name} comparison disclaimer — information, not financial advice.`,
};

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Disclaimer</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          {SITE.name} is an independent comparison service. We are not a lender,
          deposit-taker, insurer, broker or financial adviser, and nothing on this
          site is financial, legal or tax advice.
        </p>
        <p>
          <strong className="text-foreground">
            Rates indicative — verify with the provider.
          </strong>{" "}
          All rates, fees and terms are indicative only and may change at any
          time. Always confirm the exact terms directly with the provider before
          applying. Product availability and eligibility vary by country and
          applicant.
        </p>
        <p>
          We aim to keep listings accurate and current — read how in our{" "}
          <a className="text-brand hover:underline" href="/methodology">
            methodology
          </a>
          . Editorial responsibility sits with{" "}
          <span className="font-medium text-foreground">
            {SITE.editorial.responsibleName}
          </span>
          , {SITE.editorial.responsibleTitle}.
        </p>
      </div>
    </article>
  );
}
