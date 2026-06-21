import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { UserRole } from "@/generated/prisma/enums";
import { SITE } from "@/lib/site";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";

// Separate admin shell (Nav-Footer-Global-Standard §2d, §7). This layout sits
// OUTSIDE the (site) route group, so the public TopNav, footer link-mesh and
// CompareBar never render here — the structural separation that prevents any
// overlap between staff tooling and the public/user UI. Admin-only, noindex.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireRole(UserRole.ADMIN, {
    callbackUrl: "/admin",
    forbiddenRedirect: "/",
  });
  const label = session.user?.name ?? session.user?.email ?? "Admin";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="rounded-md bg-brand px-2 py-1 text-xs text-brand-foreground">
              {SITE.shortName}
            </span>
            <span className="text-sm text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ↗ View public site
            </Link>
            <AdminUserMenu label={label} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border md:block">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
