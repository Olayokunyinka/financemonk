"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CPA_ENABLED } from "@/lib/site";
import { LeadStatus } from "@/generated/prisma/enums";

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Capture an application.
//
// LEGAL GATE (see PRD §11 / .env): paid referral / intermediation of financial
// products may require a financial-services licence per country and MUST be
// cleared legally before turning this on. CPA_ENABLED is OFF by default.
//
// We always record the enquiry as a Lead (useful for analytics and the provider
// dashboard), BUT a billable CPA event + hand-off to the provider only happens
// when CPA_ENABLED is true. When off, the lead is stored as NEW and the user is
// directed to apply on the provider's own site.
export async function submitApplication(slug: string, formData: FormData) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, providerId: true },
  });
  if (!product) redirect("/");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const consent = formData.get("consent") === "on";

  if (fullName.length < 2 || !email.includes("@") || !consent) {
    redirect(`/apply/${slug}?error=1`);
  }

  await prisma.lead.create({
    data: {
      productId: product.id,
      providerId: product.providerId,
      fullName,
      email,
      phone: String(formData.get("phone") ?? "").trim() || null,
      amount: num(formData.get("amount")),
      income: num(formData.get("income")),
      consent,
      status: CPA_ENABLED ? LeadStatus.HANDED_OFF : LeadStatus.NEW,
      cpaEventAt: CPA_ENABLED ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/apply/${slug}?submitted=1`);
}
