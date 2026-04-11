/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use server mode (not static export)
  // This allows the app to use React hooks without static generation issues
  
  // Disable type checking during build (we'll handle this separately)
  typescript: {
    ignoreBuildErrors: true
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig
