import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { organisationJsonLd, websiteJsonLd, personJsonLd } from "@/lib/jsonld";
import { CompareBar } from "@/components/compare/compare-tray";

// Public chrome for every crawlable/user-facing page. The TopNav and footer
// link-mesh are server-rendered here so they are always present for anonymous
// visitors and Googlebot (Nav-Footer-Global-Standard §6). Admin pages live
// outside this group and get their own shell — no public chrome leaks into them.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd data={[organisationJsonLd(), websiteJsonLd(), personJsonLd()]} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CompareBar />
    </>
  );
}
