import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { auth } from "@/auth";
import { getProductBySlug } from "@/lib/queries";
import { submitReview } from "./actions";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Write a review",
  robots: { index: false, follow: true },
};

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ submitted?: string; error?: string }>;

const RATINGS = [5, 4, 3, 2, 1];

export default async function WriteReviewPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await props.params;
  const { submitted, error } = await props.searchParams;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Auth gate (contributions require sign-in; browsing never does).
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/product/${slug}/review`);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-2xl font-bold">Review submitted</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks! Your review of <strong>{product.name}</strong> is{" "}
          <strong>pending moderation</strong> and will appear once approved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href={`/product/${slug}`} variant="outline">
            Back to product
          </ButtonLink>
          <ButtonLink href="/ng/personal-loans">Browse more</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Review {product.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {session.user.name ?? session.user.email}. Reviews are
        moderated before they appear.
      </p>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          Please give an overall rating, a title (3+ chars), a review (10+
          chars), and tick the confirmation box.
        </div>
      ) : null}

      <form action={submitReview.bind(null, slug)} className="mt-6 space-y-5">
        <RatingSelect name="overall" label="Overall rating" required />

        <fieldset className="grid grid-cols-2 gap-4">
          <RatingSelect name="transparency" label="Transparency" />
          <RatingSelect name="customerService" label="Customer service" />
          <RatingSelect name="ease" label="Ease" />
          <RatingSelect name="value" label="Value" />
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Your relationship
          </label>
          <select
            name="reviewerType"
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="VERIFIED_CUSTOMER">
              Verified customer (proof may be requested)
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            minLength={3}
            placeholder="Sum up your experience"
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Your review</label>
          <textarea
            name="body"
            required
            minLength={10}
            rows={5}
            placeholder="What was good or bad? Be specific and fair."
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" className="mt-1" />
          <span>I confirm this is my genuine experience.</span>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="h-11 rounded-lg bg-brand px-6 font-medium text-brand-foreground hover:bg-brand/90"
          >
            Submit review
          </button>
          <Link
            href={`/product/${slug}`}
            className="flex h-11 items-center rounded-lg border border-border px-4 text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function RatingSelect({
  name,
  label,
  required = false,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required ? "" : <span className="text-muted-foreground"> (optional)</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="h-11 w-full rounded-lg border border-border bg-background px-3"
      >
        <option value="" disabled={required}>
          {required ? "Choose…" : "—"}
        </option>
        {RATINGS.map((r) => (
          <option key={r} value={r}>
            {"★".repeat(r)} {r}
          </option>
        ))}
      </select>
    </div>
  );
}
