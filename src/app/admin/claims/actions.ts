"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClaimStatus } from "@/generated/prisma/enums";
import { applyApprovedClaim } from "@/lib/providers";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Not authorised");
}

export async function approveClaim(claimId: string) {
  await assertAdmin();
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) return;
  await prisma.claim.update({
    where: { id: claimId },
    data: { status: ClaimStatus.APPROVED },
  });
  const provider = await applyApprovedClaim(claim.providerId, claim.userId);
  revalidatePath("/admin/claims");
  revalidatePath("/ng/personal-loans");
  for (const p of provider.products) revalidatePath(`/product/${p.slug}`);
}

export async function rejectClaim(claimId: string) {
  await assertAdmin();
  await prisma.claim.update({
    where: { id: claimId },
    data: { status: ClaimStatus.REJECTED },
  });
  revalidatePath("/admin/claims");
}
