import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  PiggyBank,
  ShieldPlus,
  Send,
  TrendingUp,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Financial calculators",
  description:
    "Free calculators to estimate loan repayments, savings growth, insurance needs, remittance costs, investment growth and credit-card costs across Africa.",
};

const CALCS: {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/calculators/loan-repayment",
    label: "Loan repayment",
    desc: "Monthly repayment and total cost from amount, rate and term.",
    icon: Calculator,
  },
  {
    href: "/calculators/savings-growth",
    label: "Savings growth",
    desc: "Project a savings balance with regular deposits and interest.",
    icon: PiggyBank,
  },
  {
    href: "/calculators/insurance-needs",
    label: "Insurance needs",
    desc: "Estimate the cover you need from income and dependants.",
    icon: ShieldPlus,
  },
  {
    href: "/calculators/remittance-cost",
    label: "Remittance cost",
    desc: "Compare the true cost of sending money, fees plus FX margin.",
    icon: Send,
  },
  {
    href: "/calculators/investment-growth",
    label: "Investment growth",
    desc: "Compound a lump sum or contributions over time.",
    icon: TrendingUp,
  },
  {
    href: "/calculators/credit-card-cost",
    label: "Credit-card cost",
    desc: "See interest and time-to-clear from balance and repayments.",
    icon: CreditCard,
  },
];

export default function CalculatorsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Financial calculators</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Free tools to estimate the numbers before you compare products. Results
        are indicative — always confirm exact terms with the provider.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-border p-5 transition-colors hover:border-brand hover:bg-muted/40"
          >
            <c.icon className="h-6 w-6 text-brand" />
            <div className="mt-3 font-semibold group-hover:text-brand">
              {c.label}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {SITE.name} is an independent comparison service and does not provide
        financial advice.
      </p>
    </div>
  );
}
