import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { auth } from "@/auth";
import { searchProviders } from "@/lib/providers";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Claim your listing",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ q?: string }>;

export default async function ClaimSearchPage(props: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/claim");

  const { q } = await props.searchParams;
  const results = q ? await searchProviders(q) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Claim your listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step 1 of 2 — find the provider you represent. You&apos;ll then prove you
        control it.
      </p>

      <form method="GET" action="/claim" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by provider name…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand px-5 font-medium text-brand-foreground hover:bg-brand/90"
        >
          Search
        </button>
      </form>

      {q ? (
        <div className="mt-6 space-y-3">
          {results.length === 0 ? (
            <p className="rounded-xl border border-border p-6 text-muted-foreground">
              No providers match “{q}”.
            </p>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {p.name}
                    {p.licensed ? (
                      <Badge variant="gold" title={p.licenseSource ?? ""}>
                        Licensed
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not on register</Badge>
                    )}
                    {p.claimed ? <Badge variant="neutral">Claimed</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.website ?? "No website on file"}
                  </div>
                </div>
                {p.claimed ? (
                  <span className="text-sm text-muted-foreground">
                    Already claimed
                  </span>
                ) : (
                  <Link
                    href={`/claim/${p.id}`}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90"
                  >
                    This is mine
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
