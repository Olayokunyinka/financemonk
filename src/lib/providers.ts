// Provider-side helpers: search (for the claim flow), badge recomputation, and
// the effects of approving a claim.

import { prisma } from "@/lib/prisma";
import { VerificationBadge, DisclaimerState } from "@/generated/prisma/enums";

// Extract a bare domain (no scheme/www) from a URL for domain-email matching.
export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

export async function searchProviders(q: string) {
  const term = q.trim();
  if (!term) return [];
  return prisma.provider.findMany({
    where: { name: { contains: term, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 10,
  });
}

// Recompute every product's verification badge for a provider. Mirrors the seed
// logic and is the same rule as src/lib/verification.ts: gold (PROVIDER_VERIFIED)
// only when licensed AND claimed.
export async function recomputeProviderBadges(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { products: true },
  });
  if (!provider) return;

  for (const p of provider.products) {
    let badge: VerificationBadge = VerificationBadge.UNVERIFIED;
    if (provider.licensed && provider.claimed) {
      badge = VerificationBadge.PROVIDER_VERIFIED;
    } else if (p.reviewCount >= 100 && p.ratingAggregate >= 4.0) {
      badge = VerificationBadge.POPULARITY_VERIFIED;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: {
        verificationBadge: badge,
        disclaimerState: provider.claimed
          ? DisclaimerState.PROVIDER_CONFIRMED
          : DisclaimerState.INDICATIVE,
      },
    });
  }
}

// Apply the effects of an approved claim: mark the provider claimed by the user,
// promote the user to BUSINESS, and refresh badges (turns gold for licensed
// providers). Returns the provider slug for revalidation.
export async function applyApprovedClaim(providerId: string, userId: string) {
  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: { claimed: true, claimedBy: userId },
    include: { products: { select: { slug: true } } },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { role: "BUSINESS" },
  });
  await recomputeProviderBadges(providerId);
  return provider;
}

export async function getProvidersClaimedBy(userId: string) {
  return prisma.provider.findMany({
    where: { claimedBy: userId },
    include: {
      products: { orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });
}
