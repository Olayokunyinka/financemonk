import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { Providers } from "@/components/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", url: SITE.url },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
};

// Root layout carries only the document shell + session context. The public
// chrome (TopNav + SiteFooter) lives in the (site) route-group layout, and the
// admin shell in /admin/layout — this structural split is what enforces the
// "admin never overlaps the public UI" guardrail (Nav-Footer-Global-Standard §7).
// SessionProvider stays here so both the public island and the admin shell can
// read auth state.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
