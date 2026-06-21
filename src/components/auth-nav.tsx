"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Heart, Bell, Settings } from "lucide-react";
import {
  AvatarMenu,
  MenuLink,
  MenuButton,
  MenuSeparator,
  MenuLabel,
} from "@/components/avatar-menu";

// Right side of the TopNav — the ONLY part that changes by role
// (Nav-Footer-Global-Standard §2). The left browse nav is server-rendered in
// <SiteHeader>. Admin links never appear here: the single bridge to staff
// tooling is the "Admin console" item inside the avatar menu (§2d).
export function AuthNav() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isBusiness = role === "BUSINESS";

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />;
  }

  // 2a. Anonymous
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/claim"
          className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
        >
          For Business
        </Link>
        <Link
          href="/signin"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  const avatar = (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground">
      {initial}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Provider primary action vs consumer Saved shortcut */}
      {isBusiness ? (
        <Link
          href="/dashboard"
          className="hidden rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted sm:inline"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          href="/account/saved"
          aria-label="Saved"
          className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted sm:inline-flex"
        >
          <Heart className="h-4 w-4" /> Saved
        </Link>
      )}

      <Link
        href="/account/alerts"
        aria-label="Notifications"
        className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
      >
        <Bell className="h-4 w-4" />
      </Link>

      <AvatarMenu trigger={avatar}>
        <MenuLabel>{user.name ?? user.email}</MenuLabel>
        <MenuSeparator />

        {isBusiness ? (
          <>
            <MenuLink href="/dashboard">Provider dashboard</MenuLink>
            <MenuLink href="/dashboard">My listings / products</MenuLink>
            <MenuLink href="/dashboard">Reviews to respond</MenuLink>
            <MenuLink href="/dashboard">Applications / leads</MenuLink>
            <MenuLink href="/account">Billing &amp; plan</MenuLink>
          </>
        ) : (
          <>
            <MenuLink href="/account/reviews">My reviews</MenuLink>
            <MenuLink href="/account/saved">Saved &amp; comparisons</MenuLink>
            <MenuLink href="/account/alerts">Alerts</MenuLink>
          </>
        )}

        <MenuLink href="/account">
          <span className="inline-flex items-center gap-2">
            <Settings className="h-4 w-4" /> Account settings
          </span>
        </MenuLink>

        {!isBusiness ? (
          <MenuLink href="/claim">Claim a listing</MenuLink>
        ) : null}

        {/* The ONLY door into staff tooling — admins only (§2d). */}
        {isAdmin ? (
          <>
            <MenuSeparator />
            <MenuLink href="/admin" className="text-brand">
              ⚙ Admin console
            </MenuLink>
          </>
        ) : null}

        <MenuSeparator />
        <MenuButton onClick={() => signOut({ callbackUrl: "/" })}>
          Sign out
        </MenuButton>
      </AvatarMenu>
    </div>
  );
}
