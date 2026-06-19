import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Write a review",
  robots: { index: false, follow: true },
};

export default function WriteReviewPage() {
  return (
    <ComingSoon
      title="Write a review"
      milestone="Milestone 3 (Accounts & reviews)"
    >
      Sign-in-gated review submission with sub-ratings and a moderation queue.
    </ComingSoon>
  );
}
