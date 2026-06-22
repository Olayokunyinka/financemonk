import type { Metadata } from "next";
import Link from "next/link";
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
          <Link className="text-brand hover:underline" href="/methodology">
            methodology
          </Link>
          .
        </p>
        <p>
          Questions or corrections?{" "}
          <Link className="text-brand hover:underline" href="/contact">
            Contact us
          </Link>
          .
        </p>
      </div>

      {/* Author / editor entity (E-E-A-T). Anchor referenced by the byline and
          the Person JSON-LD @id (see personJsonLd). */}
      <section
        id="editor"
        className="mt-12 scroll-mt-24 rounded-2xl border border-border p-6"
      >
        <h2 className="text-xl font-semibold">
          {SITE.editorial.responsibleName}
        </h2>
        <div className="mt-0.5 text-sm font-medium text-brand">
          {SITE.editorial.responsibleTitle}
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {SITE.editorial.bio}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <a
            className="text-brand hover:underline"
            href={`mailto:${SITE.editorial.contactEmail}`}
          >
            {SITE.editorial.contactEmail}
          </a>
          {SITE.editorial.profileUrl ? (
            <a
              className="text-brand hover:underline"
              href={SITE.editorial.profileUrl}
              target="_blank"
              rel="noopener"
            >
              Profile ↗
            </a>
          ) : null}
          <Link className="text-brand hover:underline" href="/methodology#editorial">
            Editorial standards →
          </Link>
        </div>
      </section>
    </article>
  );
}
