"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Check, X, Scale } from "lucide-react";
import { cn } from "@/lib/cn";

// A lightweight client-side "compare tray": users add 2–4 products, then open
// the side-by-side /compare view. State lives in localStorage and syncs across
// components in the same tab via a custom event (and across tabs via storage).

const KEY = "fincompare:compare";
const MAX = 4;
const EVT = "fincompare:compare-changed";

export type TrayItem = { slug: string; name: string };

function read(): TrayItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrayItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: TrayItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useCompare() {
  const [items, setItems] = useState<TrayItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((item: TrayItem) => {
    const current = read();
    const exists = current.some((i) => i.slug === item.slug);
    if (exists) {
      write(current.filter((i) => i.slug !== item.slug));
    } else if (current.length < MAX) {
      write([...current, item]);
    }
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, toggle, remove, clear, max: MAX };
}

export function CompareToggle({ slug, name }: TrayItem) {
  const { items, toggle, max } = useCompare();
  const inTray = items.some((i) => i.slug === slug);
  const full = items.length >= max && !inTray;

  return (
    <button
      type="button"
      onClick={() => toggle({ slug, name })}
      disabled={full}
      aria-pressed={inTray}
      title={
        full ? `You can compare up to ${max} products` : "Add to comparison"
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        inTray
          ? "border-brand bg-brand-muted text-brand"
          : "border-border hover:border-brand hover:text-brand",
        full && "cursor-not-allowed opacity-50",
      )}
    >
      {inTray ? (
        <>
          <Check className="h-3.5 w-3.5" /> Added
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" /> Compare
        </>
      )}
    </button>
  );
}

// Global floating bar — rendered once in the root layout.
export function CompareBar() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  const href = `/compare?ids=${items.map((i) => i.slug).join(",")}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4 text-brand" />
          Compare ({items.length})
        </span>
        <ul className="flex flex-1 flex-wrap gap-2">
          {items.map((i) => (
            <li
              key={i.slug}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
            >
              {i.name}
              <button
                type="button"
                onClick={() => remove(i.slug)}
                aria-label={`Remove ${i.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
        <Link
          href={href}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            items.length >= 2
              ? "bg-brand text-brand-foreground hover:bg-brand/90"
              : "pointer-events-none bg-muted text-muted-foreground",
          )}
        >
          {items.length >= 2 ? "Compare now" : "Add 2+ to compare"}
        </Link>
      </div>
    </div>
  );
}
