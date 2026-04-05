import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for server components
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
  // Disable static page generation for error pages
  // This forces Next.js to use the App Router for all pages
  distDir: '.next',
};

export default nextConfig;
