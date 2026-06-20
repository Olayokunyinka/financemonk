"use client";

import { SessionProvider } from "next-auth/react";

// Client session context. Kept out of the server layout's render path so the
// SEO/directory pages remain statically generated — session is fetched on the
// client and only the small auth island re-renders.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
