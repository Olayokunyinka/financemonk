// Default OpenGraph image for every route without its own. Next auto-injects the
// og:image meta. Renders via the shared generator in src/lib/og.tsx.
import { renderOgImage, OG_SIZE, OG_ALT, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const alt = OG_ALT;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgImage();
}
