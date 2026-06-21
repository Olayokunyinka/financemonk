import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Saved & comparisons" };

export default function SavedPage() {
  return (
    <ComingSoon title="Saved & comparisons" milestone="a later account milestone">
      Save products and comparisons to revisit them here.
    </ComingSoon>
  );
}
