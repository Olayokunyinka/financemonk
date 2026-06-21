import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms governing use of ${SITE.name}.`,
};

export default function TermsPage() {
  return (
    <article className="prose-sm mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().getFullYear()}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          {SITE.name} is an independent comparison service. By using the site you
          agree to these terms. We present product information for comparison
          only; we are not a lender, insurer, broker or financial adviser and we
          do not recommend any specific product.
        </p>
        <h2 className="text-base font-semibold text-foreground">
          Information, not advice
        </h2>
        <p>
          All rates, fees and terms shown are indicative and may change. Always
          confirm the exact terms directly with the provider before applying. You
          are responsible for assessing whether a product is suitable for you.
        </p>
        <h2 className="text-base font-semibold text-foreground">
          Accuracy &amp; availability
        </h2>
        <p>
          We work to keep listings current (see our{" "}
          <a className="text-brand hover:underline" href="/methodology">
            methodology
          </a>
          ) but cannot guarantee completeness or that a product remains available
          on the stated terms.
        </p>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a
            className="text-brand hover:underline"
            href={`mailto:${SITE.editorial.contactEmail}`}
          >
            {SITE.editorial.contactEmail}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
