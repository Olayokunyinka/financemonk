import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/site";
import { LastVerified } from "@/components/disclaimer";

// Visible author/source-context line for money pages (YMYL E-E-A-T). Names the
// accountable editor and links to the editorial standards; the Person entity is
// emitted as JSON-LD site-wide (see personJsonLd). Optionally shows the
// last-verified date when the page has a single canonical one (product pages).
export function ByLine({
  lastVerifiedAt,
  className = "",
}: {
  lastVerifiedAt?: Date | string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-brand" />
      <span>
        Reviewed by{" "}
        <Link
          href="/about#editor"
          className="font-medium text-foreground hover:text-brand"
        >
          {SITE.editorial.responsibleName}
        </Link>
        , {SITE.editorial.responsibleTitle}
      </span>
      <span aria-hidden>·</span>
      <Link href="/methodology" className="hover:text-brand">
        How we compare
      </Link>
      {lastVerifiedAt ? (
        <>
          <span aria-hidden>·</span>
          <LastVerified date={lastVerifiedAt} />
        </>
      ) : null}
    </div>
  );
}
