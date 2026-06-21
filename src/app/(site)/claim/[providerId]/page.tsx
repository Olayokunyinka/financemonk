import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { domainOf } from "@/lib/providers";
import { submitClaim } from "./actions";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Verify your claim",
  robots: { index: false, follow: true },
};

type Params = Promise<{ providerId: string }>;
type SearchParams = Promise<{ pending?: string; error?: string }>;

export default async function ClaimVerifyPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { providerId } = await props.params;
  const { pending, error } = await props.searchParams;

  const session = await auth();
  if (!session?.user) redirect(`/signin?callbackUrl=/claim/${providerId}`);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });
  if (!provider) notFound();
  if (provider.claimed) redirect("/dashboard");

  const domain = domainOf(provider.website);

  if (pending) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Clock className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 text-2xl font-bold">Claim submitted for review</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks — we&apos;ll review your claim for <strong>{provider.name}</strong>{" "}
          and email you. (An administrator approves document/manual claims.)
        </p>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-brand hover:underline">
            ← Back home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Prove you represent {provider.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step 2 of 2.{" "}
        {provider.licensed ? (
          <Badge variant="gold">Licensed · {provider.licenseSource}</Badge>
        ) : (
          <Badge variant="outline">Not on the licence register</Badge>
        )}
      </p>

      {!provider.licensed ? (
        <div className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Note: this provider isn&apos;t matched to the licence register, so even
          once claimed it cannot show the gold “Verified” badge.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error === "email"
            ? "Enter a valid email address."
            : error === "doc"
              ? "Enter a document reference."
              : "Please choose a verification method."}
        </div>
      ) : null}

      {/* Method 1: domain email */}
      <form
        action={submitClaim.bind(null, providerId)}
        className="mt-6 rounded-xl border border-border p-5"
      >
        <input type="hidden" name="method" value="email" />
        <h2 className="font-semibold">Verify with a work email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {domain ? (
            <>
              Use an email on <strong>@{domain}</strong> and you&apos;ll be
              verified instantly.
            </>
          ) : (
            "This provider has no website on file, so email verification isn't available."
          )}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          <input
            type="email"
            name="email"
            required
            placeholder={domain ? `you@${domain}` : "you@company.com"}
            className="h-11 flex-1 rounded-lg border border-border bg-background px-3"
          />
        </div>
        <button
          type="submit"
          className="mt-4 h-11 rounded-lg bg-brand px-5 font-medium text-brand-foreground hover:bg-brand/90"
        >
          Verify by email
        </button>
      </form>

      {/* Method 2: document */}
      <form
        action={submitClaim.bind(null, providerId)}
        className="mt-4 rounded-xl border border-border p-5"
      >
        <input type="hidden" name="method" value="document" />
        <h2 className="font-semibold">Or upload a registration document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference a CAC certificate or authorisation letter. An administrator
          will review it.
        </p>
        <input
          type="text"
          name="docRef"
          placeholder="e.g. CAC-RC-123456 or filename"
          className="mt-3 h-11 w-full rounded-lg border border-border bg-background px-3"
        />
        <button
          type="submit"
          className="mt-4 h-11 rounded-lg border border-border px-5 font-medium hover:bg-muted"
        >
          Submit for review
        </button>
      </form>

      <p className="mt-6 text-sm">
        <Link href="/claim" className="text-brand hover:underline">
          ← Back to search
        </Link>
      </p>
    </div>
  );
}
