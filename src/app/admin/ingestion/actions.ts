"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publishDraft, getPendingDrafts } from "@/lib/ingestion";
import { familyByType } from "@/lib/taxonomy";

async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Not authorised");
}

function revalidateForSlug(slug: string, country: string, productType: string) {
  revalidatePath(`/product/${slug}`);
  const fam = familyByType(productType as never);
  if (fam) revalidatePath(`/${country}/${fam.slug}`);
  revalidatePath("/admin/ingestion");
}

export async function approveDraft(draftId: string) {
  await assertAdmin();
  const draft = await prisma.productDraft.findUnique({ where: { id: draftId } });
  const res = await publishDraft(draftId);
  if (res.ok && draft)
    revalidateForSlug(res.slug, draft.country, draft.productType);
  else revalidatePath("/admin/ingestion");
}

export async function rejectDraft(draftId: string) {
  await assertAdmin();
  await prisma.productDraft.update({
    where: { id: draftId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/ingestion");
}

export async function approveAllPending() {
  await assertAdmin();
  const drafts = await getPendingDrafts();
  for (const d of drafts) {
    const res = await publishDraft(d.id);
    if (res.ok) revalidateForSlug(res.slug, d.country, d.productType);
  }
  revalidatePath("/admin/ingestion");
}
