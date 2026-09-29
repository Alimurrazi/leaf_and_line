import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Artwork is exported as optimized WebP by scripts/export-pages.mjs.
  // Serving it as-is keeps caption sharpness under our control.
  images: { unoptimized: true },
};

export default nextConfig;
