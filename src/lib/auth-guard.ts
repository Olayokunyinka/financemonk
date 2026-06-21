// Centralised server-side route guards (Nav-Footer-Global-Standard §5). Hiding a
// nav link is cosmetic; these helpers are the real gate and run on every request
// in the protected layouts. Middleware (src/middleware.ts) is the first line;
// these layout-level checks are defense-in-depth and also give us the session
// object for rendering.

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProvidersClaimedBy } from "@/lib/providers";
import type { UserRole } from "@/generated/prisma/enums";

// Any signed-in user. Used by /account/*.
export async function requireUser(callbackUrl = "/account") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}

// Require a specific role. ADMIN composes over everything, so an admin always
// passes. Wrong role → forbiddenRedirect (default home); unauthenticated →
// sign-in with a returnTo.
export async function requireRole(
  role: UserRole,
  opts: { callbackUrl?: string; forbiddenRedirect?: string } = {},
) {
  const session = await auth();
  const current = session?.user?.role;
  if (!session?.user?.id) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(opts.callbackUrl ?? "/")}`,
    );
  }
  if (current !== role && current !== "ADMIN") {
    redirect(opts.forbiddenRedirect ?? "/");
  }
  return session;
}

// Provider area: must be signed in AND own at least one claimed listing.
// Returns the claimed providers so the dashboard can render them without a
// second query. ADMIN may pass through for support/QA.
export async function requireBusinessOwner(callbackUrl = "/dashboard") {
  const session = await requireUser(callbackUrl);
  const providers = await getProvidersClaimedBy(session.user!.id);
  if (providers.length === 0 && session.user!.role !== "ADMIN") {
    // Signed in but owns nothing to manage — send them to the claim flow.
    redirect("/claim");
  }
  return { session, providers };
}

// Ownership check for a specific listing (a provider may only edit THEIR
// listings). Use inside dashboard server actions/pages that take a listingId.
export async function assertBusinessOwner(listingId: string) {
  const session = await requireUser("/dashboard");
  if (session.user!.role === "ADMIN") return session;
  const providers = await getProvidersClaimedBy(session.user!.id);
  const owns = providers.some((p) => p.id === listingId);
  if (!owns) redirect("/dashboard");
  return session;
}
