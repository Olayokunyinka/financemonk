import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <ComingSoon title="Alerts & notifications" milestone="a later account milestone">
      Get notified when rates change on the products you follow.
    </ComingSoon>
  );
}
