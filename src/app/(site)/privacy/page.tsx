import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE.name} handles your data.`,
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().getFullYear()}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          This policy explains what we collect and why. Browsing {SITE.name} never
          requires an account. We only ask you to sign in to contribute — to write
          a review or claim a listing.
        </p>
        <h2 className="text-base font-semibold text-foreground">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details (email, name) when you sign in.</li>
          <li>Content you submit (reviews, claim requests).</li>
          <li>Basic, aggregated usage analytics to improve the service.</li>
        </ul>
        <h2 className="text-base font-semibold text-foreground">Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal
          data at any time by emailing{" "}
          <a
            className="text-brand hover:underline"
            href={`mailto:${SITE.editorial.contactEmail}`}
          >
            {SITE.editorial.contactEmail}
          </a>
          .
        </p>
        <p>
          See also our{" "}
          <a className="text-brand hover:underline" href="/cookies">
            cookie policy
          </a>
          .
        </p>
      </div>
    </article>
  );
}
