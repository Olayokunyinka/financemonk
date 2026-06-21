"use client";

import { useRouter } from "next/navigation";

// Footer country/currency switcher (Nav-Footer-Global-Standard §3). Options are
// computed server-side from live hubs and passed in, so the control only
// navigates — no client data fetching. Each option points at that country's
// first live hub.
export function CountryCurrencySelect({
  options,
}: {
  options: { code: string; name: string; currency: string; href: string }[];
}) {
  const router = useRouter();

  if (options.length === 0) return null;

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">Country and currency</span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
      >
        <option value="" disabled>
          Country / Currency
        </option>
        {options.map((o) => (
          <option key={o.code} value={o.href}>
            {o.name} · {o.currency}
          </option>
        ))}
      </select>
    </label>
  );
}
