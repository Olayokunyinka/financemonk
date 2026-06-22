// Shared OpenGraph / Twitter card renderer. Used by app/opengraph-image.tsx and
// app/twitter-image.tsx so the social card is defined once. ImageResponse runs
// Satori, so only inline styles + flex layouts are supported here — no external
// CSS/Tailwind.
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = `${SITE.name} — ${SITE.tagline}`;

export function renderOgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "#0f766e",
            }}
          />
          <div
            style={{
              color: "#99f6e4",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: "68px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
              maxWidth: "900px",
            }}
          >
            Compare financial products across Africa
          </div>
          <div style={{ color: "#94a3b8", fontSize: "30px", maxWidth: "880px" }}>
            Real rates, fees and terms — licence-checked providers, indicative
            figures with a last-verified date.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              background: "#b45309",
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: "9999px",
            }}
          >
            Independent
          </div>
          <div style={{ color: "#64748b", fontSize: "24px" }}>
            {SITE.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
