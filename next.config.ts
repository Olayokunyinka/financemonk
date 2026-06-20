import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/pdfjs-dist load a worker file at runtime; bundling them breaks the
  // worker path. Keep them external so the cron route requires them natively
  // (from node_modules) where the worker resolves. (M7 ingestion refresh.)
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
