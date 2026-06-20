"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommissionStatus } from "@/generated/prisma/enums";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Not authorised");
}

// Admin sets/clears the CPA payout for a product (the negotiated deal rate).
export async function setPayout(productId: string, formData: FormData) {
  await assertAdmin();
  const raw = String(formData.get("cpaPayout") ?? "").trim();
  const value = raw === "" ? null : Number(raw.replace(/[, ]/g, ""));
  await prisma.product.update({
    where: { id: productId },
    data: { cpaPayout: value != null && Number.isFinite(value) ? value : null },
  });
  revalidatePath("/admin/revenue");
}

// Admin marks a commission as paid (reconciliation).
export async function markCommissionPaid(commissionId: string) {
  await assertAdmin();
  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: CommissionStatus.PAID },
  });
  revalidatePath("/admin/revenue");
}
