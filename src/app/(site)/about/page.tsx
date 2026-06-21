import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: SITE.description,
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">About {SITE.name}</h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>{SITE.description}</p>
        <p>
          We structure financial products so the things that actually matter —
          rates, fees and terms — sit side by side and can be compared honestly.
          Browsing is always free and never gated.
        </p>
        <h2 className="text-base font-semibold text-foreground">
          Independent &amp; accountable
        </h2>
        <p>
          We are independent and label any sponsored placement. Editorial
          responsibility sits with a named, accountable person:{" "}
          <span className="font-medium text-foreground">
            {SITE.editorial.responsibleName}
          </span>
          , {SITE.editorial.responsibleTitle}. Read how we source and rank
          products in our{" "}
          <a className="text-brand hover:underline" href="/methodology">
            methodology
          </a>
          .
        </p>
        <p>
          Questions or corrections?{" "}
          <a className="text-brand hover:underline" href="/contact">
            Contact us
          </a>
          .
        </p>
      </div>
    </article>
  );
}
