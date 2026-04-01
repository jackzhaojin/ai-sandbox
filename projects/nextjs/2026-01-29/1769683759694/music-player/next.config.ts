import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip static generation for now - focus on dynamic
  output: 'standalone',
};

export default nextConfig;
