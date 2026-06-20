import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { getRuns, getPendingDrafts } from "@/lib/ingestion";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { approveDraft, rejectDraft, approveAllPending } from "./actions";

export const metadata: Metadata = {
  title: "Ingestion QA",
  robots: { index: false, follow: false },
};

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default async function IngestionPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin/ingestion");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not authorised</h1>
        <p className="mt-2 text-muted-foreground">Administrators only.</p>
      </div>
    );
  }

  const [runs, drafts] = await Promise.all([getRuns(), getPendingDrafts()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Database className="h-6 w-6 text-brand" /> Ingestion QA
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Drafts from the ingestion pipeline (<code>npm run ingest</code>). Nothing
        is public until you approve it; approving stamps a fresh last-verified
        date and marks figures indicative.
      </p>
      <p className="mt-1 text-sm">
        <Link href="/admin/reviews" className="text-brand hover:underline">Reviews</Link>{" "}·{" "}
        <Link href="/admin/claims" className="text-brand hover:underline">Claims</Link>{" "}·{" "}
        <Link href="/admin/revenue" className="text-brand hover:underline">Revenue</Link>
      </p>

      {/* Latest runs */}
      {runs.length > 0 ? (
        <div className="mt-6 rounded-xl border border-border p-4 text-sm">
          <div className="font-medium">Latest runs</div>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {runs.map((r) => (
              <li key={r.id}>
                {formatDate(r.startedAt)} · <span className="font-mono">{r.adapter}</span> —{" "}
                {r.created} new, {r.changed} changed, {r.unchanged} unchanged
                {r.errors ? `, ${r.errors} errors` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Pending drafts ({drafts.length})
        </h2>
        {drafts.length > 0 ? (
          <form action={approveAllPending}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Approve all
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        {drafts.length === 0 ? (
          <p className="rounded-xl border border-border p-6 text-muted-foreground">
            No pending drafts. Run <code>npm run ingest</code> to generate some.
          </p>
        ) : (
          drafts.map((d) => {
            const diff = (d.diff ?? {}) as Record<
              string,
              { from: unknown; to: unknown }
            >;
            const diffKeys = Object.keys(diff);
            return (
              <div key={d.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.name}</span>
                  <Badge
                    variant={
                      d.changeKind === "NEW"
                        ? "brand"
                        : d.changeKind === "CHANGED"
                          ? "gold"
                          : "neutral"
                    }
                  >
                    {d.changeKind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {d.providerSlug} · {d.country} · {d.productSlug}
                  </span>
                </div>

                {d.issues.length > 0 ? (
                  <div className="mt-2 flex items-start gap-1 text-xs text-gold">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                    {d.issues.join("; ")}
                  </div>
                ) : null}

                {/* Diff (changed fields) */}
                {d.changeKind === "CHANGED" && diffKeys.length > 0 ? (
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-1 font-medium">Field</th>
                        <th className="py-1 font-medium">Current</th>
                        <th className="py-1 font-medium">Incoming</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffKeys.map((k) => (
                        <tr key={k} className="border-t border-border">
                          <td className="py-1 pr-3 font-medium">{k}</td>
                          <td className="py-1 pr-3 text-muted-foreground line-through">
                            {fmt(diff[k].from)}
                          </td>
                          <td className="py-1 text-foreground">{fmt(diff[k].to)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}

                {d.changeKind === "NEW" ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Interest {fmt(d.aprMin)}–{fmt(d.aprMax)}% · amount{" "}
                    {fmt(d.minAmount)}–{fmt(d.maxAmount)} {d.currency}
                  </p>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <form action={approveDraft.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/90"
                    >
                      {d.changeKind === "NEW" ? "Publish new product" : "Approve & publish"}
                    </button>
                  </form>
                  <form action={rejectDraft.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="h-9 rounded-lg border border-border px-4 text-sm hover:bg-muted"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
