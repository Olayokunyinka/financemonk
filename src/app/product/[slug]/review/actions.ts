"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewerType } from "@/generated/prisma/enums";

function clampRating(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

// Auth-gated. Creates a review with status PENDING — it does NOT appear publicly
// until an admin approves it in the moderation queue.
export async function submitReview(slug: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/product/${slug}/review`);
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) redirect("/");

  const overall = clampRating(formData.get("overall"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const confirmed = formData.get("confirm") === "on";

  // Basic validation — bounce back with an error flag if invalid.
  if (!overall || title.length < 3 || body.length < 10 || !confirmed) {
    redirect(`/product/${slug}/review?error=1`);
  }

  const reviewerType =
    String(formData.get("reviewerType") ?? "") === "VERIFIED_CUSTOMER"
      ? ReviewerType.VERIFIED_CUSTOMER
      : ReviewerType.CUSTOMER;

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: session.user.id,
      authorName: session.user.name ?? session.user.email ?? "Anonymous",
      overall,
      transparency: clampRating(formData.get("transparency")),
      customerService: clampRating(formData.get("customerService")),
      ease: clampRating(formData.get("ease")),
      value: clampRating(formData.get("value")),
      title,
      body,
      reviewerType,
      // status defaults to PENDING (moderation queue).
    },
  });

  redirect(`/product/${slug}/review?submitted=1`);
}
