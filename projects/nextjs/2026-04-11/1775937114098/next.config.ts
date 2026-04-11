import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export for now to avoid React 19 hydration issues
  distDir: ".next",
};

export default nextConfig;
