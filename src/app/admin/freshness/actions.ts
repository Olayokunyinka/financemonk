"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { familyByType } from "@/lib/taxonomy";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Not authorised");
}

// Admin marks a product's figures as re-checked now (refreshes lastVerifiedAt).
export async function markProductVerified(productId: string) {
  await assertAdmin();
  const product = await prisma.product.update({
    where: { id: productId },
    data: { lastVerifiedAt: new Date() },
    select: { slug: true, country: true, productType: true },
  });
  revalidatePath(`/product/${product.slug}`);
  const fam = familyByType(product.productType);
  if (fam) revalidatePath(`/${product.country}/${fam.slug}`);
  revalidatePath("/admin/freshness");
}
