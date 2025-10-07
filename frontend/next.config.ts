import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Optimize for production builds
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-checkbox', '@radix-ui/react-label', '@radix-ui/react-select']
  }
};

export default nextConfig;
