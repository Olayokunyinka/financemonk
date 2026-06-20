// Recompute a product's denormalised rating aggregate from its PUBLISHED
// reviews. Called whenever a review is published or unpublished (moderation).
//
// Note: seed products ship with placeholder aggregate values representing prior
// customer sentiment. Once a product receives a moderated on-platform review,
// its aggregate is recomputed from on-platform PUBLISHED reviews only.

import { prisma } from "@/lib/prisma";

export async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "PUBLISHED" },
    _avg: { overall: true },
    _count: { _all: true },
  });
  const count = agg._count._all;
  const avg = agg._avg.overall ?? 0;
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAggregate: count > 0 ? Math.round(avg * 10) / 10 : 0,
      reviewCount: count,
    },
  });
}
