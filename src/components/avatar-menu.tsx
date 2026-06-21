"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// Hand-built click-toggle dropdown (no CLI/Radix), matching the src/components/ui
// primitive style. Closes on outside-click and Escape. Used for the header
// avatar menu and the admin-shell account menu.
export function AvatarMenu({
  trigger,
  children,
  align = "end",
  label = "Account menu",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute top-full z-40 mt-2 w-60 rounded-lg border border-border bg-background p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

// Menu primitives so call-sites stay declarative.
export function MenuLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MenuButton({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "block w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 border-t border-border" />;
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}
