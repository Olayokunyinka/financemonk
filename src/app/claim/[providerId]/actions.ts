"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClaimMethod, ClaimStatus } from "@/generated/prisma/enums";
import { domainOf, emailDomain, applyApprovedClaim } from "@/lib/providers";

// Submit a claim. Two proof methods:
//  - Domain email: if the email's domain matches the provider's website domain
//    we auto-approve (a pragmatic stand-in for the emailed verification code,
//    which needs a mail service). Otherwise it becomes a PENDING staff review.
//  - Document: always PENDING staff review (admin approves in /admin/claims).
export async function submitClaim(providerId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/claim/${providerId}`);
  }
  const userId = session.user.id;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });
  if (!provider) redirect("/claim");
  if (provider.claimed) redirect("/dashboard");

  const method = String(formData.get("method") ?? "");

  if (method === "email") {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email.includes("@")) {
      redirect(`/claim/${providerId}?error=email`);
    }
    const matches =
      !!domainOf(provider.website) &&
      emailDomain(email) === domainOf(provider.website);

    const claim = await prisma.claim.create({
      data: {
        providerId,
        userId,
        method: ClaimMethod.DOMAIN_EMAIL,
        evidence: email,
        status: matches ? ClaimStatus.APPROVED : ClaimStatus.PENDING,
      },
    });

    if (matches) {
      const p = await applyApprovedClaim(providerId, userId);
      revalidatePath("/dashboard");
      revalidatePath("/ng/personal-loans");
      for (const prod of p.products) revalidatePath(`/product/${prod.slug}`);
      redirect(`/dashboard?claimed=1`);
    }
    redirect(`/claim/${providerId}?pending=1&claim=${claim.id}`);
  }

  if (method === "document") {
    const ref = String(formData.get("docRef") ?? "").trim();
    if (ref.length < 3) redirect(`/claim/${providerId}?error=doc`);
    await prisma.claim.create({
      data: {
        providerId,
        userId,
        method: ClaimMethod.DOCUMENT,
        evidence: ref,
        status: ClaimStatus.PENDING,
      },
    });
    redirect(`/claim/${providerId}?pending=1`);
  }

  redirect(`/claim/${providerId}?error=method`);
}
