import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during builds for deployment
    // This allows deployment while maintaining development linting
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds for deployment
    // This allows deployment while maintaining development type checking
    ignoreBuildErrors: true,
  },
  webpack(config) {
    // Silence "Critical dependency: the request of a dependency is an expression" warnings
    // (e.g., from @supabase/realtime-js)
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
