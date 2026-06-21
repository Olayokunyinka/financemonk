"use client";

import { signOut } from "next-auth/react";
import {
  AvatarMenu,
  MenuLink,
  MenuButton,
  MenuSeparator,
  MenuLabel,
} from "@/components/avatar-menu";

// Admin-shell account menu. The only door OUT of the shell is "View public
// site"; the public browse/consumer/provider chrome never appears here (§2d).
export function AdminUserMenu({ label }: { label: string }) {
  const initial = label.charAt(0).toUpperCase() || "A";
  return (
    <AvatarMenu
      label="Admin account"
      trigger={
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-medium text-brand-foreground">
          {initial}
        </span>
      }
    >
      <MenuLabel>{label}</MenuLabel>
      <MenuSeparator />
      <MenuLink href="/">↗ View public site</MenuLink>
      <MenuLink href="/account">Account settings</MenuLink>
      <MenuSeparator />
      <MenuButton onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </MenuButton>
    </AvatarMenu>
  );
}
