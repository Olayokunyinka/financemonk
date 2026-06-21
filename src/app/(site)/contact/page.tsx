import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${SITE.name} team.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-2 text-muted-foreground">
        Corrections, data issues, partnership and press enquiries — we read
        everything.
      </p>

      <div className="mt-8 space-y-4 text-sm">
        <a
          href={`mailto:${SITE.editorial.contactEmail}`}
          className="flex items-center gap-3 rounded-2xl border border-border p-5 transition-colors hover:border-brand hover:bg-muted/40"
        >
          <Mail className="h-5 w-5 text-brand" />
          <span>
            <span className="block font-semibold">General &amp; editorial</span>
            <span className="text-muted-foreground">
              {SITE.editorial.contactEmail}
            </span>
          </span>
        </a>
        <p className="text-sm text-muted-foreground">
          Are you a provider? You can{" "}
          <a className="text-brand hover:underline" href="/claim">
            claim your listing
          </a>{" "}
          or{" "}
          <a className="text-brand hover:underline" href="/advertise">
            advertise with us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
