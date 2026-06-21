import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Download,
  Building2,
  DollarSign,
  Flag,
  Activity,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

const CARDS: { href: string; label: string; desc: string; icon: LucideIcon }[] =
  [
    {
      href: "/admin/reviews",
      label: "Moderation",
      desc: "Approve or reject pending reviews, riskiest first.",
      icon: ShieldCheck,
    },
    {
      href: "/admin/ingestion",
      label: "Ingestion",
      desc: "Review the QA queue from ingestion adapters.",
      icon: Download,
    },
    {
      href: "/admin/claims",
      label: "Providers",
      desc: "Process listing claims and verification.",
      icon: Building2,
    },
    {
      href: "/admin/revenue",
      label: "Revenue",
      desc: "Sponsored placements and referral settings.",
      icon: DollarSign,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      desc: "User-reported reviews and content.",
      icon: Flag,
    },
    {
      href: "/admin/freshness",
      label: "Freshness",
      desc: "Data last-verified status across listings.",
      icon: Activity,
    },
  ];

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Staff tooling — moderation, ingestion, providers and revenue.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
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
    </div>
  );
}
