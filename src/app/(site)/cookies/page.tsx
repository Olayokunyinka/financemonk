import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: `How ${SITE.name} uses cookies.`,
};

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Cookie policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().getFullYear()}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          Cookies are small files stored by your browser. {SITE.name} uses them
          sparingly:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Essential</strong> — to keep you
            signed in and remember your compare selection.
          </li>
          <li>
            <strong className="text-foreground">Analytics</strong> — aggregated,
            to understand which comparisons are useful.
          </li>
        </ul>
        <p>
          You can clear or block cookies in your browser settings; essential
          features (sign-in, compare) may stop working if you do.
        </p>
      </div>
    </article>
  );
}
