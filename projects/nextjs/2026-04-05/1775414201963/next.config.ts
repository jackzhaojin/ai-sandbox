import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export - requires server components for auth
  output: 'standalone',
  // Disable eslint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure we use Node.js runtime
  serverExternalPackages: ['@supabase/ssr'],
  // Disable powered by header
  poweredByHeader: false,
  // Configure images
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
