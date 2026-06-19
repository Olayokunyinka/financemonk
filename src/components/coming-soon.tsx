import Link from "next/link";
import { Construction } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

// Honest placeholder for routes that are scoped to a later milestone, so links
// in the Milestone 1 build never 404 during the demo.
export function ComingSoon({
  title,
  milestone,
  children,
}: {
  title: string;
  milestone: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Construction className="mx-auto h-10 w-10 text-brand" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is part of <strong>{milestone}</strong> and isn&apos;t built yet.
      </p>
      {children ? (
        <div className="mt-4 text-sm text-muted-foreground">{children}</div>
      ) : null}
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/ng/personal-loans" variant="outline">
          Browse personal loans
        </ButtonLink>
        <ButtonLink href="/">Home</ButtonLink>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        <Link href="/methodology" className="hover:underline">
          How we compare
        </Link>
      </p>
    </div>
  );
}
