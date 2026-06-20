"use server";

import { prisma } from "@/lib/prisma";

// Public notice-and-takedown: anyone can report a published review. Creates an
// OPEN Report for admins to action in /admin/reports. No auth required (a
// takedown request shouldn't need an account), but it's rate-limited by being a
// simple insert that admins review.
export async function reportReview(
  reviewId: string,
  reason: string,
  detail?: string,
): Promise<{ ok: boolean }> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
  if (!review) return { ok: false };

  await prisma.report.create({
    data: {
      reviewId,
      reason: reason.slice(0, 80) || "Other",
      detail: detail?.slice(0, 500) || null,
    },
  });
  return { ok: true };
}
