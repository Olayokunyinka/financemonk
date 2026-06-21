import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Plain-language guides to borrowing, saving, cards, insurance and investing across Africa — how products work and how to compare them.",
};

// Editorial guides hub. Topics are listed here; individual guide articles land
// in a later content milestone, so each links to the most relevant live surface
// for now (no dead links).
const TOPICS: { title: string; desc: string; href: string }[] = [
  {
    title: "How to compare personal loans",
    desc: "APR vs flat rate, fees, and the real cost of borrowing.",
    href: "/ng/personal-loans",
  },
  {
    title: "Choosing a savings account",
    desc: "Interest, access, and what the headline rate hides.",
    href: "/ng/savings-accounts",
  },
  {
    title: "Credit cards explained",
    desc: "Interest, the grace period, and avoiding the debt trap.",
    href: "/ng/credit-cards",
  },
  {
    title: "Understanding insurance cover",
    desc: "What you actually need, and reading the exclusions.",
    href: "/ng/health-insurance",
  },
  {
    title: "How we compare products",
    desc: "Our data sources, ranking and editorial standards.",
    href: "/methodology",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-brand" />
        <h1 className="text-3xl font-bold">Guides</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Plain-language explainers on borrowing, saving, cards, insurance and
        investing — and how to compare them without the jargon.
      </p>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {TOPICS.map((t) => (
          <li key={t.title}>
            <Link
              href={t.href}
              className="block px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="font-semibold">{t.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
