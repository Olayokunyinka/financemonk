import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <ComingSoon title="Faceted search" milestone="Milestone 2 (Discovery tools)">
      Filter products by rate, fees, amount, tenure and provider type using
      Postgres full-text search. For now, browse the comparison hub.
    </ComingSoon>
  );
}
