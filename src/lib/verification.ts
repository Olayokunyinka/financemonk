// Verification badge logic — a HARD finance guardrail.
//
// The gold "Verified" badge (PROVIDER_VERIFIED) is ONLY valid when the provider
// is matched to the licensed-institution register (licensed === true) AND has
// claimed the listing (claimed === true). We never label an unlicensed or
// unknown provider as "Verified". This module is the single source of truth so
// no page can accidentally over-state trust.

import { VerificationBadge } from "@/generated/prisma/enums";

export type BadgeInput = {
  verificationBadge: VerificationBadge;
  licensed: boolean;
  claimed: boolean;
  licenseSource?: string | null;
  licenseVerifiedAt?: Date | string | null;
};

export type BadgeDisplay = {
  tier: "gold" | "grey" | "none";
  label: string;
  /** Tooltip text disclosing the basis for the badge. */
  basis: string;
};

export function resolveBadge(input: BadgeInput): BadgeDisplay {
  // Gold requires BOTH licensing and a claim — enforced here regardless of the
  // stored enum, so a mislabelled record can never render as gold.
  if (
    input.verificationBadge === VerificationBadge.PROVIDER_VERIFIED &&
    input.licensed &&
    input.claimed
  ) {
    const src = input.licenseSource ?? "the national licence register";
    return {
      tier: "gold",
      label: "Verified",
      basis: `Provider licensed and listing claimed. Matched against ${src}.`,
    };
  }

  if (input.verificationBadge === VerificationBadge.POPULARITY_VERIFIED) {
    return {
      tier: "grey",
      label: "Popular",
      basis:
        "Popularity-verified: earned automatically from reviews, profile completeness and engagement. Not a licence check.",
    };
  }

  return {
    tier: "none",
    label: "Unverified",
    basis:
      "Not yet verified. We have not confirmed this provider's licence or received a claim for this listing.",
  };
}
