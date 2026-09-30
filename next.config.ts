import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Artwork is exported as optimized WebP by the local studio (src/studio/export.ts).
  // Serving it as-is keeps caption sharpness under our control.
  images: { unoptimized: true },
};

export default nextConfig;
