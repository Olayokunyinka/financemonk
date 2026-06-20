"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DisclaimerState, LeadStatus } from "@/generated/prisma/enums";

// Ensure the signed-in user controls the product (claimed its provider) or is an
// admin. Returns the product slug for revalidation.
async function assertOwnsProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { provider: { select: { claimedBy: true } } },
  });
  if (!product) throw new Error("Not found");
  const owns = product.provider.claimedBy === session.user.id;
  if (!owns && session.user.role !== "ADMIN") throw new Error("Not authorised");
  return product.slug;
}

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Edit a product's comparable terms. Saving stamps lastVerifiedAt = now and
// marks the figures provider-confirmed (the "confirm current" idea applied to
// edits too).
export async function updateProduct(productId: string, formData: FormData) {
  const slug = await assertOwnsProduct(productId);

  const feePct = num(formData.get("feePct"));
  const fees =
    feePct != null
      ? [{ label: "Management fee", amount: feePct, unit: "%" }]
      : [];

  const eligibility = String(formData.get("eligibility") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.product.update({
    where: { id: productId },
    data: {
      summary: String(formData.get("summary") ?? "").trim() || null,
      aprMin: num(formData.get("aprMin")),
      aprMax: num(formData.get("aprMax")),
      minAmount: num(formData.get("minAmount")),
      maxAmount: num(formData.get("maxAmount")),
      minTenureMonths: num(formData.get("minTenureMonths")),
      maxTenureMonths: num(formData.get("maxTenureMonths")),
      ...(feePct != null ? { fees } : {}),
      ...(eligibility.length ? { eligibility } : {}),
      lastVerifiedAt: new Date(),
      disclaimerState: DisclaimerState.PROVIDER_CONFIRMED,
    },
  });

  revalidatePath(`/product/${slug}`);
  revalidatePath("/ng/personal-loans");
  revalidatePath("/dashboard");
}

// "Confirm current" — refresh the freshness date without changing figures.
export async function confirmCurrent(productId: string) {
  const slug = await assertOwnsProduct(productId);
  await prisma.product.update({
    where: { id: productId },
    data: {
      lastVerifiedAt: new Date(),
      disclaimerState: DisclaimerState.PROVIDER_CONFIRMED,
    },
  });
  revalidatePath(`/product/${slug}`);
  revalidatePath("/ng/personal-loans");
  revalidatePath("/dashboard");
}

// Provider updates the status of an application/lead (CPA reconciliation basis).
export async function updateLeadStatus(leadId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { provider: { select: { claimedBy: true } } },
  });
  if (!lead) throw new Error("Not found");
  const owns = lead.provider.claimedBy === session.user.id;
  if (!owns && session.user.role !== "ADMIN") throw new Error("Not authorised");

  const next = (Object.values(LeadStatus) as string[]).includes(status)
    ? (status as LeadStatus)
    : LeadStatus.NEW;
  await prisma.lead.update({ where: { id: leadId }, data: { status: next } });
  revalidatePath("/dashboard");
}

export async function respondToReview(reviewId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { include: { provider: { select: { claimedBy: true } } } } },
  });
  if (!review) throw new Error("Not found");
  const owns = review.product.provider.claimedBy === session.user.id;
  if (!owns && session.user.role !== "ADMIN") throw new Error("Not authorised");

  const response = String(formData.get("response") ?? "").trim();
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerResponse: response || null,
      ownerRespondedAt: response ? new Date() : null,
    },
  });
  revalidatePath(`/product/${review.product.slug}`);
  revalidatePath("/dashboard");
}
