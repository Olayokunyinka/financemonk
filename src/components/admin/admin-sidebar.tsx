"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Download,
  Building2,
  DollarSign,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

// Admin-shell sidebar (Nav-Footer-Global-Standard §2d). These links exist ONLY
// inside the admin shell — they never appear in the public header.
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reviews", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/ingestion", label: "Ingestion", icon: Download },
  { href: "/admin/claims", label: "Providers", icon: Building2 },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              active
                ? "bg-brand/10 font-medium text-brand"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
