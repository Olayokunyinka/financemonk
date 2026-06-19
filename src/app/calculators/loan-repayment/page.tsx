import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Loan repayment calculator",
  robots: { index: false, follow: true },
};

export default function LoanCalculatorPage() {
  return (
    <ComingSoon
      title="Loan repayment calculator"
      milestone="Milestone 2 (Discovery tools)"
    >
      Estimate your monthly repayment and total cost, then jump to matching
      products. The maths is already wired up (see the &ldquo;What you&apos;d
      actually pay&rdquo; box on any product page).
    </ComingSoon>
  );
}
