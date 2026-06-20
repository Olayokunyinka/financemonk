// Shared parsing helpers for ingestion adapters (extracted from the original
// example-provider scraper so every adapter reuses the same logic).

export const USER_AGENT =
  "FinancecomparyBot/0.1 (+https://financecompary.com/bot)";

// Parse a money value. A k/m suffix only multiplies when it's NOT part of a word
// (so "24months" -> 24, but "5m" -> 5,000,000).
export function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[, ]/g, "");
  const withSuffix = cleaned.match(/([0-9]+(?:\.[0-9]+)?)([mk])(?![a-z])/i);
  if (withSuffix) {
    const n = parseFloat(withSuffix[1]);
    return /m/i.test(withSuffix[2]) ? n * 1_000_000 : n * 1_000;
  }
  const plain = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/);
  return plain ? parseFloat(plain[1]) : null;
}

// Parse a "X - Y" style range into [min, max]; a single value yields [v, v].
export function parseRange(s: string): [number | null, number | null] {
  const parts = s.split(/[-–—]/).map((p) => p.trim());
  if (parts.length >= 2) return [parseMoney(parts[0]), parseMoney(parts[1])];
  const one = parseMoney(s);
  return [one, one];
}

// Parse a percentage like "18%" or "18% - 24%" -> [18, 24].
export function parsePercentRange(s: string): [number | null, number | null] {
  return parseRange(s.replace(/%/g, ""));
}

// Minimal robots.txt check: respect Disallow under "User-agent: *".
export async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const u = new URL(targetUrl);
    const res = await fetch(`${u.origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return true;
    const lines = (await res.text()).split("\n").map((l) => l.trim());
    let inStar = false;
    const disallows: string[] = [];
    for (const line of lines) {
      if (/^user-agent:/i.test(line)) inStar = /\*\s*$/.test(line);
      else if (inStar && /^disallow:/i.test(line)) {
        const path = line.split(":")[1]?.trim() ?? "";
        if (path) disallows.push(path);
      }
    }
    return !disallows.some((d) => u.pathname.startsWith(d));
  } catch {
    return true;
  }
}

// Fetch a URL only if robots.txt permits. Returns null if blocked/failed.
export async function politeFetch(
  url: string,
): Promise<{ text: () => Promise<string>; arrayBuffer: () => Promise<ArrayBuffer> } | null> {
  if (!(await isAllowedByRobots(url))) {
    console.warn(`  ✗ Blocked by robots.txt: ${url}`);
    return null;
  }
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.warn(`  ✗ Fetch ${url} -> HTTP ${res.status}`);
    return null;
  }
  return res;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
