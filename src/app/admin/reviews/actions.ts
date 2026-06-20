"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recomputeProductRating } from "@/lib/ratings";
import { ReviewStatus } from "@/generated/prisma/enums";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Not authorised");
  }
}

async function setStatus(reviewId: string, status: ReviewStatus) {
  await assertAdmin();
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
    select: { productId: true, product: { select: { slug: true } } },
  });
  // Aggregate depends only on PUBLISHED reviews, so recompute on any change.
  await recomputeProductRating(review.productId);
  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${review.product.slug}`);
}

export async function approveReview(reviewId: string) {
  await setStatus(reviewId, ReviewStatus.PUBLISHED);
}

export async function rejectReview(reviewId: string) {
  await setStatus(reviewId, ReviewStatus.REJECTED);
}
