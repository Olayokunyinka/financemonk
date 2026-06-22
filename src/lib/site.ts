// Site-wide configuration and editorial identity.
//
// E-E-A-T (YMYL) requires *named editorial responsibility* and a visible
// methodology surface from the first public milestone. These values feed the
// footer, the methodology page, and Organisation JSON-LD.

export const SITE = {
  name: "FinanceMonk",
  shortName: "FinanceMonk",
  tagline: "Compare financial products across Africa",
  description:
    "Independent, structured comparison of financial products across Africa — rates, fees and terms you can actually compare, with reviews and licence-checked providers.",
  // Base URL used for canonical links, sitemap and JSON-LD. Configure via env
  // in production (Vercel) so it points at the live domain.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // Brand logo (in /public) — used for Organization JSON-LD + the OG image.
  logo: { path: "/logo.png", width: 1217, height: 390 },

  // Brand social / external profiles for schema.org `sameAs` (entity
  // consolidation → knowledge panel). Comma-separated absolute URLs in env;
  // empty means the field is simply omitted from the JSON-LD.
  sameAs: (process.env.NEXT_PUBLIC_SITE_SAMEAS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Named editorial responsibility (required for YMYL/E-E-A-T). Real,
  // accountable person; overridable via env for different deployments. The bio
  // + profileUrl feed the Person JSON-LD (author entity) and the /about byline.
  editorial: {
    responsibleName:
      process.env.NEXT_PUBLIC_EDITORIAL_NAME ?? "Olayinka Olayokun",
    responsibleTitle:
      process.env.NEXT_PUBLIC_EDITORIAL_TITLE ??
      "Editor & Data Standards Lead",
    contactEmail:
      process.env.NEXT_PUBLIC_EDITORIAL_EMAIL ?? "mrolayokun@gmail.com",
    bio:
      process.env.NEXT_PUBLIC_EDITORIAL_BIO ??
      "Sets the data standards behind every comparison on FinanceMonk — how product terms are sourced, normalised to a comparable basis, dated and verified against the licence registers. Accountable for editorial accuracy across the directory.",
    // External author profile (e.g. LinkedIn) → Person.sameAs. Strengthens the
    // author entity; omitted from schema when empty.
    profileUrl: process.env.NEXT_PUBLIC_EDITORIAL_PROFILE_URL ?? "",
  },
} as const;

// Thin-content threshold: a comparison hub is only indexed when it has at least
// this many live products AND a unique editorial intro. Configurable via env.
export const HUB_MIN_PRODUCTS = Number(process.env.HUB_MIN_PRODUCTS ?? "5");

// Apply -> referral (CPA) monetisation gate. Default OFF everywhere.
// WARNING: enabling paid referral / intermediation of financial products may
// require a financial-services licence PER COUNTRY and MUST be cleared legally
// first (see PRD §11). This only wires the gate; it is not legal advice.
//
// CPA is now gated PER COUNTRY: only countries whose codes are listed in
// CPA_ENABLED_COUNTRIES (comma-separated ISO-2, e.g. "ng,ke") have referral
// switched on, after their legal clearance. Empty = off everywhere (safe).
// CPA_ENABLED kept as a legacy global master for back-compat.
export const CPA_ENABLED = process.env.CPA_ENABLED === "true";

const CPA_COUNTRIES = (process.env.CPA_ENABLED_COUNTRIES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isCpaEnabled(country: string): boolean {
  return CPA_ENABLED || CPA_COUNTRIES.includes(country.toLowerCase());
}
