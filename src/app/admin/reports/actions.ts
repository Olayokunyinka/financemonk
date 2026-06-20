"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recomputeProductRating } from "@/lib/ratings";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Not authorised");
}

// Take down the reported review: mark it REJECTED (removes it publicly),
// recompute the product aggregate, and close the report.
export async function takedownReport(reportId: string) {
  await assertAdmin();
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { review: { include: { product: { select: { slug: true } } } } },
  });
  if (!report) return;

  await prisma.review.update({
    where: { id: report.reviewId },
    data: { status: "REJECTED" },
  });
  await recomputeProductRating(report.review.productId);
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "ACTIONED" },
  });

  revalidatePath("/admin/reports");
  revalidatePath(`/product/${report.review.product.slug}`);
}

export async function dismissReport(reportId: string) {
  await assertAdmin();
  await prisma.report.update({
    where: { id: reportId },
    data: { status: "DISMISSED" },
  });
  revalidatePath("/admin/reports");
}
