import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "My reviews" };

export default function MyReviewsPage() {
  return (
    <ComingSoon title="My reviews" milestone="a later account milestone">
      The reviews you&apos;ve written will be listed and editable here.
    </ComingSoon>
  );
}
