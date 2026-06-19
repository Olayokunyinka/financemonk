import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { HUB_MIN_PRODUCTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "How we compare — methodology, data sources & editorial standards",
  description:
    "How FinCompare Africa ranks financial products, where our data comes from, how often we update it, and who is editorially responsible.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">How we compare</h1>
      <p className="mt-3 text-muted-foreground">
        {SITE.name} exists to make financial products genuinely comparable. This
        page explains how we rank products, where our data comes from, how we
        keep it fresh, and who is accountable for it. Money decisions are
        important, so we hold ourselves to a high standard of transparency.
      </p>

      <Section title="What we list">
        We list individual financial <strong>products</strong> (for example a
        specific personal loan), not companies or apps. Each product carries its
        comparable terms — interest/APR, fees, amount, tenure, eligibility and
        required documents — normalised so you can compare like with like.
      </Section>

      <Section title="How we rank">
        By default we rank by customer rating. You can re-sort any comparison by
        lowest interest, lowest fees or smallest minimum amount. Ranking and
        commercial relationships are kept separate: a provider paying for
        placement appears as a clearly labelled{" "}
        <strong>Sponsored</strong> row and is never silently mixed into the
        organic ranking. Ranking never influences whether a provider is shown as
        licence-verified.
      </Section>

      <Section title="What the badges mean">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Verified (gold):</strong> the provider is matched to the
            relevant central-bank / financial-authority licence register{" "}
            <em>and</em> has claimed and confirmed its listing. Unlicensed or
            unclaimed providers never receive this badge.
          </li>
          <li>
            <strong>Popular (grey):</strong> earned automatically by listings
            with strong reviews and engagement. It is not a licence check.
          </li>
        </ul>
      </Section>

      <Section title="Where our data comes from">
        Product terms are compiled from providers&apos; own websites, rate cards
        and disclosure documents, and from regulator-published references. The
        licence backbone is the national register of licensed institutions (in
        Nigeria, the Central Bank of Nigeria). Each product page cites its
        sources where available.
      </Section>

      <Section title="Freshness">
        Rates and fees change constantly, and a wrong rate is a real harm — so
        every product and every comparison row shows a{" "}
        <strong>last-verified date</strong> and an{" "}
        <strong>&ldquo;indicative — confirm with provider&rdquo;</strong>{" "}
        disclaimer. Figures we haven&apos;t re-checked recently are visibly
        flagged. Claimed providers can confirm their own data to keep it current.
      </Section>

      <Section title="Thin-content discipline">
        We only publish a comparison hub when it has at least{" "}
        {HUB_MIN_PRODUCTS} live products and a unique, written introduction.
        Empty or near-empty pages are not indexed. We never mass-generate hollow
        pages.
      </Section>

      <Section title="Important: we are not financial advisers">
        {SITE.name} is an independent comparison service. The information here is
        general and indicative; it is not financial, legal or tax advice. Always
        confirm exact terms with the provider and seek professional advice for
        your circumstances.
      </Section>

      {/* Named editorial responsibility — required for YMYL E-E-A-T. */}
      <section id="editorial" className="mt-10 rounded-xl border border-border p-5">
        <h2 className="text-xl font-semibold">Editorial &amp; data standards</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Editorial responsibility for {SITE.name} sits with{" "}
          <strong className="text-foreground">
            {SITE.editorial.responsibleName}
          </strong>{" "}
          ({SITE.editorial.responsibleTitle}). Corrections and data disputes:{" "}
          <a
            href={`mailto:${SITE.editorial.contactEmail}`}
            className="text-brand hover:underline"
          >
            {SITE.editorial.contactEmail}
          </a>
          .
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{SITE.editorial.note}</p>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/ng/personal-loans" className="text-brand hover:underline">
          ← Back to best personal loans in Nigeria
        </Link>
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-muted-foreground">{children}</div>
    </section>
  );
}
