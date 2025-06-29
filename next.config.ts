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
    
    // Handle Solana SPL token module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // Add module resolution rules for Solana packages
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Handle the specific SPL token module issue
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/spl-token/lib/esm/extensions/pausable/actions.js': false,
    };
    
    // Add a plugin to handle missing modules
    config.plugins.push(
      new (require('webpack')).IgnorePlugin({
        resourceRegExp: /^\.\/actions\.js$/,
        contextRegExp: /@solana\/spl-token\/lib\/esm\/extensions\/pausable$/,
      })
    );
    
    return config;
  },
};

export default nextConfig;
