// Site-wide configuration and editorial identity.
//
// E-E-A-T (YMYL) requires *named editorial responsibility* and a visible
// methodology surface from the first public milestone. These values feed the
// footer, the methodology page, and Organisation JSON-LD.

export const SITE = {
  name: "FinCompare Africa",
  shortName: "FinCompare",
  tagline: "Compare financial products across Africa",
  description:
    "Independent, structured comparison of financial products across Africa — rates, fees and terms you can actually compare, with reviews and licence-checked providers.",
  // Base URL used for canonical links, sitemap and JSON-LD. Configure via env
  // in production (Vercel) so it points at the live domain.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // Named editorial responsibility (required for YMYL/E-E-A-T).
  editorial: {
    responsibleName: "The FinCompare Africa Editorial Team",
    responsibleTitle: "Editorial & Data Standards",
    contactEmail: "editorial@fincompare.africa",
    // SEED placeholder — replace with the real accountable editor before launch.
    note: "SEED placeholder editorial identity — replace with the real named, accountable editor before public launch.",
  },
} as const;

// Thin-content threshold: a comparison hub is only indexed when it has at least
// this many live products AND a unique editorial intro. Configurable via env.
export const HUB_MIN_PRODUCTS = Number(process.env.HUB_MIN_PRODUCTS ?? "5");

// Apply -> referral (CPA) monetisation gate. Default OFF.
// WARNING: enabling paid referral / intermediation of financial products may
// require a financial-services licence per country and MUST be cleared legally
// first (see PRD §11). This flag only wires the gate; it is not legal advice.
export const CPA_ENABLED = process.env.CPA_ENABLED === "true";
