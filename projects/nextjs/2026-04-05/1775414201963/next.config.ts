import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  distDir: '.next',
  // Environment variables for build
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export default nextConfig;
