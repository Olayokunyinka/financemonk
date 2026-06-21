import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertCircle, ExternalLink, Info } from "lucide-react";
import { getProductBySlug } from "@/lib/queries";
import { isCpaEnabled } from "@/lib/site";
import { submitApplication } from "./actions";
import { ButtonLink } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

export const metadata: Metadata = {
  title: "Apply",
  robots: { index: false, follow: true }, // transactional, no SEO value
};

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ submitted?: string; error?: string }>;

export default async function ApplyPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await props.params;
  const { submitted, error } = await props.searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const CPA_ENABLED = isCpaEnabled(product.country);

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-bold">
          {CPA_ENABLED ? "Application received" : "Enquiry recorded"}
        </h1>
        {CPA_ENABLED ? (
          <p className="mt-2 text-muted-foreground">
            We&apos;ve recorded your application for{" "}
            <strong>{product.name}</strong> and will hand it off to{" "}
            {product.provider.name}.
          </p>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">
              Thanks. Guided referral isn&apos;t enabled for this country yet, so
              we haven&apos;t shared your details. You can apply directly on{" "}
              {product.provider.name}&apos;s website.
            </p>
            {product.provider.website ? (
              <ButtonLink
                href={product.provider.website}
                target="_blank"
                rel="nofollow noopener"
                variant="accent"
                className="mt-5"
              >
                Continue on {product.provider.name}
                <ExternalLink className="h-4 w-4" />
              </ButtonLink>
            ) : null}
          </>
        )}
        <div className="mt-6">
          <Link href={`/product/${slug}`} className="text-sm text-brand hover:underline">
            ← Back to {product.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Apply for {product.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {product.provider.name}
      </p>

      {/* CPA gate notice */}
      {!CPA_ENABLED ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Guided referral is currently <strong>disabled</strong> for this
            country. We&apos;ll record your enquiry but won&apos;t send your
            details to the provider — you&apos;ll be directed to apply on their
            site. (Paid referral may require a financial-services licence.)
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          Please enter your name, a valid email, and tick consent.
        </div>
      ) : null}

      <form
        action={submitApplication.bind(null, slug)}
        className="mt-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount you want (₦)">
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 500000"
              className="h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </Field>
          <Field label="Monthly income (₦)">
            <input
              name="income"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 250000"
              className="h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </Field>
        </div>

        <Field label="Full name">
          <input
            name="fullName"
            required
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            name="phone"
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </Field>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" className="mt-1" />
          <span>
            {CPA_ENABLED
              ? `I consent to share these details with ${product.provider.name}.`
              : "I understand my enquiry is recorded and I'll apply on the provider's own website."}
          </span>
        </label>

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-accent px-6 font-medium text-white hover:bg-accent/90"
        >
          {CPA_ENABLED ? "Continue to provider" : "Record enquiry"}
        </button>
      </form>

      <Disclaimer className="mt-4" lastVerifiedAt={product.lastVerifiedAt} />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
