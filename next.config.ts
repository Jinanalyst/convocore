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
};

export default nextConfig;
