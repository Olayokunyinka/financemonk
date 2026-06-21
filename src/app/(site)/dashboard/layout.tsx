import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { UserRole } from "@/generated/prisma/enums";

// Provider workspace (Nav-Footer-Global-Standard §1, §5). Signed-in + business
// role (admin composes through); noindex. Per-listing ownership is enforced in
// the dashboard pages/actions via assertBusinessOwner — a provider may only edit
// THEIR listings, not just "is a business".
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole(UserRole.BUSINESS, {
    callbackUrl: "/dashboard",
    forbiddenRedirect: "/",
  });
  return children;
}
