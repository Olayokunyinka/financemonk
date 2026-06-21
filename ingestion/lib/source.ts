// Live-fetch gate. A "real" adapter only reaches out to the network when BOTH
// the operator asked for --live AND a human has cleared the source's terms
// (adapter.tos.status === "approved"). Anything else falls back to the bundled
// offline fixture, with a clear log line, so a run is never silently scraping a
// source whose ToS hasn't been confirmed.
//
// This is deliberately conservative: robots.txt is also enforced at fetch time
// (politeFetch), but robots alone doesn't equal permission — ToS sign-off is a
// separate, human decision we encode here.
import type { Adapter } from "../adapters/types";

export function liveAllowed(adapter: Adapter, live: boolean): boolean {
  if (!live) return false;
  if (adapter.tos.status === "approved") return true;

  const why =
    adapter.tos.status === "blocked"
      ? "source ToS forbids automated access"
      : "ToS not yet reviewed/approved";
  console.warn(
    `  ⚠ ${adapter.id}: --live requested but ${why} ` +
      `(tos.status="${adapter.tos.status}", checked ${adapter.tos.checkedAt}). ` +
      `Falling back to offline fixture. ${adapter.tos.notes}`,
  );
  return false;
}
