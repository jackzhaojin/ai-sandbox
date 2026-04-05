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
  // Disable static page generation timeout (we use dynamic rendering)
  staticPageGenerationTimeout: 1000,
  // Ensure we use Node.js runtime
  serverExternalPackages: ['@supabase/ssr'],
};

export default nextConfig;
