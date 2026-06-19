import { BadgeCheck, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolveBadge, type BadgeInput } from "@/lib/verification";

// Renders the trust badge with a disclosure tooltip (title) of its basis.
// Gold is only ever shown for licensed + claimed providers (enforced in
// resolveBadge). For unverified providers we render nothing by default to avoid
// clutter, unless `showUnverified` is set.
export function VerifiedBadge({
  input,
  showUnverified = false,
}: {
  input: BadgeInput;
  showUnverified?: boolean;
}) {
  const b = resolveBadge(input);

  if (b.tier === "gold") {
    return (
      <Badge variant="gold" title={b.basis}>
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        {b.label}
      </Badge>
    );
  }

  if (b.tier === "grey") {
    return (
      <Badge variant="neutral" title={b.basis}>
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {b.label}
      </Badge>
    );
  }

  if (!showUnverified) return null;
  return (
    <Badge variant="outline" title={b.basis}>
      <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
      {b.label}
    </Badge>
  );
}
