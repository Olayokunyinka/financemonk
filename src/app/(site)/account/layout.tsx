import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";

// Consumer workspace (Nav-Footer-Global-Standard §1, §5). Any signed-in user;
// noindex so crawlers never reach it. Keeps the public chrome (it lives inside
// the (site) group) but is auth-gated server-side here AND in middleware.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser("/account");
  return children;
}
